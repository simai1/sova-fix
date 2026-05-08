import crypto from 'crypto';
import { Op } from 'sequelize';
import httpStatus from 'http-status';
import UserTgBindingToken from '../models/userTgBindingToken';
import User from '../models/user';
import TgUser from '../models/tgUser';
import Contractor from '../models/contractor';
import roles from '../config/roles';
import wsEvents from '../config/wsEvents';
import { emitTo } from '../utils/ws';
import ApiError from '../utils/ApiError';

// TTL токена — 15 минут (Europe/Moscow по проекту, но Date в Node — UTC; разница
// в TTL отсутствует, главное — единая система отсчёта new Date()).
const TOKEN_TTL_MS = 15 * 60 * 1000;
const TOKEN_BYTES = 16;

const sha256 = (input: string): string => crypto.createHash('sha256').update(input).digest('hex');

// Init: повторный вызов в течение 15 минут инвалидирует все предыдущие активные
// токены (consumedAt = now), как описано в design-doc §D. Без этого юзер мог
// бы держать «лишние» активные ссылки и параллельно жать «привязать» в нескольких
// вкладках — стрелять себе в ногу.
const init = async (userId: string): Promise<{ token: string; deepLink: string; expiresAt: Date }> => {
    await UserTgBindingToken.update(
        { consumedAt: new Date() },
        {
            where: {
                userId,
                consumedAt: null,
                expiresAt: { [Op.gt]: new Date() },
            },
        }
    );

    const plaintext = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = sha256(plaintext);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await UserTgBindingToken.create({
        userId,
        tokenHash,
        expiresAt,
    } as any);

    // BOT_USERNAME — env-переменная, см. design-doc «Незакрытые вопросы #3».
    // Если её нет (test/dev без бота), отдаём fallback — фронт всё равно может
    // показать токен, но deep-link не сработает; в test'е мы парсим plaintext
    // из ответа отдельно.
    // Валидируем под TG-grammar (5..32 alnum/_, начинается с буквы) — без этого
    // некорректная env-переменная утянула бы plaintext-токен на сторонний хост
    // через `https://t.me/${botUsername}…` (sec-audit C-1).
    const rawBotUsername = process.env.TG_BOT_USERNAME || 'sova_fix_bot';
    if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(rawBotUsername)) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Некорректная конфигурация TG_BOT_USERNAME');
    }
    const deepLink = `https://t.me/${rawBotUsername}?start=link_${plaintext}`;

    return { token: plaintext, deepLink, expiresAt };
};

// Consume: вызывается ботом через verifyMaster-роут /tgUsers/bind. Находит токен
// по SHA-256 (plaintext в БД не храним), проверяет TTL и consumed-флаг,
// создаёт/связывает TgUser и для CONTRACTOR пишет Contractor.tgUserId.
// Для CUSTOMER связь оставляем неявной (пушей бот ему не шлёт по дизайну).
const consume = async (
    plaintextToken: string,
    tgId: string,
    tgUsername?: string | null
): Promise<{ userId: string; tgUserId: string }> => {
    if (!plaintextToken || typeof plaintextToken !== 'string') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Токен привязки недействителен или истёк');
    }
    const tokenHash = sha256(plaintextToken);

    // Атомарный consume: одним UPDATE'ом находим живой токен и помечаем
    // consumedAt — это закрывает race-двойной-consume и заодно делает таймингово
    // одинаковыми ответы для «нет такого / уже использован / истёк»
    // (sec-audit H-1, H-2). Все три сценария отдают одинаковую BAD_REQUEST.
    const now = new Date();
    const [, affectedRows] = await UserTgBindingToken.update(
        { consumedAt: now },
        {
            where: {
                tokenHash,
                consumedAt: null,
                expiresAt: { [Op.gt]: now },
            },
            returning: true,
        }
    );
    const record = affectedRows[0];
    if (!record) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Токен привязки недействителен или истёк');
    }

    const user = await User.findByPk(record.userId);
    if (!user) {
        // Юзер удалён за время жизни токена — возвращаем тот же текст,
        // чтобы не сигналить наружу про существование/отсутствие userId.
        throw new ApiError(httpStatus.BAD_REQUEST, 'Токен привязки недействителен или истёк');
    }

    // Конфликт: tgId уже занят другим пользователем (через TgUser.tgId unique).
    // Не «вытесняем» силой, чтобы атакующий не мог завладеть чужой телегой
    // через брут токена.
    const existingTg = await TgUser.findOne({ where: { tgId: String(tgId) } });
    let tgUser: TgUser;
    if (existingTg) {
        // Conflict-чек делаем для ВСЕХ ролей (sec-audit M-9): без этого
        // CUSTOMER через consume мог бы перезаписать TgUser.name любого чужого
        // TgUser, в том числе уже привязанного к другому контрактору.
        const conflict = await Contractor.findOne({
            where: {
                tgUserId: existingTg.id,
                userId: { [Op.ne]: user.id },
            },
        });
        if (conflict) {
            throw new ApiError(httpStatus.CONFLICT, 'Этот Telegram уже привязан к другому пользователю');
        }
        tgUser = existingTg;
        // Обновим имя, если бот прислал свежее.
        if (tgUsername && existingTg.name !== tgUsername) {
            await existingTg.update({ name: tgUsername });
        }
    } else {
        tgUser = await TgUser.create({
            name: tgUsername || 'TG user',
            role: user.role,
            tgId: String(tgId),
            isConfirmed: true,
        } as any);
    }

    if (user.role === roles.CONTRACTOR) {
        const contractor = await Contractor.findOne({ where: { userId: user.id } });
        if (contractor) {
            await contractor.update({ tgUserId: tgUser.id });
        }
    }

    // record.update({ consumedAt }) больше не нужен — UPDATE выше уже
    // заматчил и пометил запись атомарно (sec-audit H-1).

    // Адресная доставка: только userId самого юзера. Бот тоже получит
    // (через isBot-fanout в emitTo), но web-клиенты — только владелец токена.
    emitTo({ kind: 'user', userId: user.id }, wsEvents.USER_TG_BIND_OK, { userId: user.id });

    return { userId: user.id, tgUserId: tgUser.id };
};

const status = async (userId: string): Promise<{ linked: boolean; tgId?: string | null }> => {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');

    if (user.role === roles.CONTRACTOR) {
        const contractor = await Contractor.findOne({
            where: { userId },
            include: [{ model: TgUser }],
        });
        const tg = contractor?.TgUser;
        if (tg?.tgId) {
            // Маскируем tgId — отдаём только последние 4 цифры. Полный tgId
            // — потенциальный сигнал для социальной инженерии в TG.
            const masked = String(tg.tgId);
            const tail = masked.slice(-4);
            return { linked: true, tgId: `***${tail}` };
        }
    }
    return { linked: false };
};

const unbind = async (userId: string): Promise<void> => {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');

    if (user.role === roles.CONTRACTOR) {
        const contractor = await Contractor.findOne({ where: { userId } });
        if (!contractor || !contractor.tgUserId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Telegram не был привязан');
        }
        await contractor.update({ tgUserId: null as any });
        return;
    }

    // Для прочих ролей TG-связь не материализована — считаем «не было».
    throw new ApiError(httpStatus.BAD_REQUEST, 'Telegram не был привязан');
};

export default {
    init,
    consume,
    status,
    unbind,
};
