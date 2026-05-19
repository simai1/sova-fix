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

const TOKEN_TTL_MS = 15 * 60 * 1000;
const TOKEN_BYTES = 16;

const sha256 = (input: string): string => crypto.createHash('sha256').update(input).digest('hex');

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

    const rawBotUsername = process.env.TG_BOT_USERNAME || 'sova_fix_bot';
    if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(rawBotUsername)) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Некорректная конфигурация TG_BOT_USERNAME');
    }
    const deepLink = `https://t.me/${rawBotUsername}?start=link_${plaintext}`;

    return { token: plaintext, deepLink, expiresAt };
};

const consume = async (
    plaintextToken: string,
    tgId: string,
    tgUsername?: string | null
): Promise<{ userId: string; tgUserId: string }> => {
    if (!plaintextToken || typeof plaintextToken !== 'string') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Токен привязки недействителен или истёк');
    }
    const tokenHash = sha256(plaintextToken);

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
        throw new ApiError(httpStatus.BAD_REQUEST, 'Токен привязки недействителен или истёк');
    }

    const existingTg = await TgUser.findOne({ where: { tgId: String(tgId) } });
    let tgUser: TgUser;
    if (existingTg) {
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

    throw new ApiError(httpStatus.BAD_REQUEST, 'Telegram не был привязан');
};

export default {
    init,
    consume,
    status,
    unbind,
};
