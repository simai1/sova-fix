import winston from 'winston';
import Transport from 'winston-transport';
import SystemLog from '../models/systemLog';

// Лимиты буфера для DB-transport. Подобраны с расчётом на «тихий» сервис
// (десятки логов в минуту), но достаточно низко, чтобы при flood'е
// не съесть RAM:
//   - flush'имся либо при достижении BATCH_SIZE (берём пачкой через bulkCreate),
//   - либо по таймеру FLUSH_INTERVAL_MS (минимально частый I/O), либо при
//     beforeExit (не теряем хвост при штатном завершении процесса).
//   - на overflow (>BUFFER_HARD_CAP) дропаем самые старые записи и пишем
//     одно warning'е в stderr, чтобы было видно проблему в docker-логах.
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 5_000;
const BUFFER_HARD_CAP = 1_000;

type BufferedLog = {
    level: string;
    message: string;
    service?: string;
    meta: Record<string, unknown> | null;
    createdAt: Date;
};

class SystemLogDbTransport extends Transport {
    private buffer: BufferedLog[] = [];
    private timer: NodeJS.Timeout | null = null;
    private flushing = false;
    // dropped считаем глобально (с прошлого warn'а), чтобы не спамить stderr
    // при стабильном flood'е. Сбрасывается после успешного варн-сообщения.
    private dropped = 0;
    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
        // Завершение процесса: сбрасываем буфер, чтобы не потерять хвост.
        // beforeExit срабатывает только при «естественном» дрейне event loop;
        // для SIGTERM/SIGINT это не страховка, но лучше, чем ничего.
        process.once('beforeExit', () => {
            void this.flush().catch(() => {});
        });
    }

    private isModelReady(): boolean {
        // SystemLog.init() вызывается в dbUtils.initializeDbModels() уже после
        // того, как модули logger/ApiError успели импортироваться. До этого
        // момента Sequelize кидает на bulkCreate() — пробуем определить
        // готовность через наличие attributes (после init() они появляются).
        return Boolean((SystemLog as any).rawAttributes && (SystemLog as any).sequelize);
    }

    log(info: any, callback: () => void) {
        // Не блокируем emit-pipeline winston'а: всегда зовём callback сразу,
        // фактический insert делает таймер/batch.
        setImmediate(() => this.emit('logged', info));

        try {
            const level = String(info?.level ?? 'info');
            const allowed = level === 'info' || level === 'warn' || level === 'error';
            if (!allowed) {
                callback();
                return;
            }

            // info[Symbol.for('splat')] — массив доп.аргументов logger.log({...}, x, y).
            // info[Symbol.for('message')] — финальный rendered string. Не используем
            // его, так как уже содержит JSON-обёртку — нам нужен «чистый» message.
            const rawMessage = typeof info?.message === 'string' ? info.message : JSON.stringify(info?.message);
            // Гасим аномалии: пустой message ломает NOT NULL.
            const message = rawMessage && rawMessage.length > 0 ? rawMessage : '(empty)';

            const meta = this.extractMeta(info);
            const service = typeof info?.service === 'string' ? info.service : 'user-service';

            const entry: BufferedLog = {
                level,
                message,
                service,
                meta,
                createdAt: new Date(),
            };

            if (this.buffer.length >= BUFFER_HARD_CAP) {
                // Дропаем самый старый, чтобы flood не задушил RAM. Считаем
                // дропы и логируем suммарно при следующем flush'е.
                this.buffer.shift();
                this.dropped += 1;
            }
            this.buffer.push(entry);

            if (this.buffer.length >= BATCH_SIZE) {
                void this.flush();
            } else if (!this.timer) {
                this.timer = setTimeout(() => {
                    this.timer = null;
                    void this.flush();
                }, FLUSH_INTERVAL_MS);
                // Не блокируем event-loop при graceful exit.
                if (typeof this.timer.unref === 'function') this.timer.unref();
            }
        } catch (e) {
            // Логгер не должен ронять приложение. Любая ошибка в pipeline —
            // в stderr, и идём дальше.
            // eslint-disable-next-line no-console
            console.error('[logger] db-transport error:', (e as Error).message);
        }
        callback();
    }

    private extractMeta(info: any): Record<string, unknown> | null {
        // Стандартные поля winston, которые не должны попадать в meta.
        const skip = new Set(['level', 'message', 'service', 'timestamp']);
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(info || {})) {
            if (skip.has(key)) continue;
            out[key] = info[key];
        }
        // Symbol-keys (splat / level-symbol) явно не сериализуем —
        // Object.keys их и так не вернёт.
        return Object.keys(out).length > 0 ? out : null;
    }

    private async flush(): Promise<void> {
        if (this.flushing) return;
        if (this.buffer.length === 0) return;

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.flushing = true;
        const batch = this.buffer.splice(0, this.buffer.length);
        const droppedSnapshot = this.dropped;
        this.dropped = 0;

        try {
            if (!this.isModelReady()) {
                // Модель ещё не init()ed (приложение в фазе старта) — возвращаем
                // батч в начало буфера и ждём следующего тика. Если init никогда
                // не случится — file-transports сохранят логи, фатально не теряем.
                this.buffer.unshift(...batch);
                this.dropped += droppedSnapshot;
                this.scheduleNext();
                return;
            }

            await SystemLog.bulkCreate(
                batch.map(b => ({
                    level: b.level,
                    message: b.message,
                    service: b.service,
                    meta: b.meta,
                    createdAt: b.createdAt,
                })),
                { logging: false, returning: false }
            );

            if (droppedSnapshot > 0) {
                // eslint-disable-next-line no-console
                console.error(`[logger] db-transport overflow: dropped ${droppedSnapshot} oldest entries`);
            }
        } catch (e) {
            // БД недоступна — пишем в stderr и НЕ возвращаем батч в буфер,
            // чтобы он не рос до бесконечности. File-transports писали этот
            // же лог независимо, так что ничего не теряется фатально.
            // eslint-disable-next-line no-console
            console.error('[logger] db-transport flush failed:', (e as Error).message);
        } finally {
            this.flushing = false;
            if (this.buffer.length > 0) this.scheduleNext();
        }
    }

    private scheduleNext() {
        if (this.timer) return;
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.flush();
        }, FLUSH_INTERVAL_MS);
        if (typeof this.timer.unref === 'function') this.timer.unref();
    }
}

const transports: winston.transport[] = [
    // File-transports оставляем рядом с DB: при недоступности БД (старт
    // контейнера, миграция, потеря коннекта) логи всё равно осядут на диск.
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
];

// В test-окружении DB-transport не подключаем — vitest гоняет прокат на
// тестовой БД, а insert'ы из ApiError ломали бы счётчики/изолированность
// (в `test/setup.ts` модели инициализируются позже первого ApiError'а
// в импорте). Это поведение можно включить позже отдельным флагом.
if (process.env.NODE_ENV !== 'test') {
    transports.push(new SystemLogDbTransport({ level: 'info' }));
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports,
});

export default logger;
