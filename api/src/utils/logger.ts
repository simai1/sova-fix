import winston from 'winston';
import Transport from 'winston-transport';
import SystemLog from '../models/systemLog';

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
    private dropped = 0;
    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
        process.once('beforeExit', () => {
            void this.flush().catch(() => {});
        });
    }

    private isModelReady(): boolean {
        return Boolean((SystemLog as any).rawAttributes && (SystemLog as any).sequelize);
    }

    log(info: any, callback: () => void) {
        setImmediate(() => this.emit('logged', info));

        try {
            const level = String(info?.level ?? 'info');
            const allowed = level === 'info' || level === 'warn' || level === 'error';
            if (!allowed) {
                callback();
                return;
            }

            const rawMessage = typeof info?.message === 'string' ? info.message : JSON.stringify(info?.message);
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
                if (typeof this.timer.unref === 'function') this.timer.unref();
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[logger] db-transport error:', (e as Error).message);
        }
        callback();
    }

    private extractMeta(info: any): Record<string, unknown> | null {
        const skip = new Set(['level', 'message', 'service', 'timestamp']);
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(info || {})) {
            if (skip.has(key)) continue;
            out[key] = info[key];
        }
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
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
];

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
