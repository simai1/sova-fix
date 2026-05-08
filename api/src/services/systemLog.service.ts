import { Op, WhereOptions } from 'sequelize';
import httpStatus from 'http-status';
import SystemLog, { SystemLogLevel } from '../models/systemLog';
import SystemLogDto from '../dtos/systemLog.dto';
import ApiError from '../utils/ApiError';

type ListParams = {
    level?: SystemLogLevel | 'all';
    from?: string | Date;
    to?: string | Date;
    q?: string;
    limit?: number;
    cursor?: string;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const parseDate = (value: string | Date | undefined, label: string): Date | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Некорректное значение поля ${label}`);
    }
    return d;
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, m => `\\${m}`);

const list = async (params: ListParams) => {
    const limitRaw = Number(params.limit ?? DEFAULT_LIMIT);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT, 1), MAX_LIMIT);

    const where: WhereOptions = {};

    if (params.level && params.level !== 'all') {
        (where as any).level = params.level;
    }

    const from = parseDate(params.from, 'from');
    const to = parseDate(params.to, 'to');
    const cursor = parseDate(params.cursor, 'cursor');

    const createdAtClauses: any[] = [];
    if (from) createdAtClauses.push({ [Op.gte]: from });
    if (to) createdAtClauses.push({ [Op.lte]: to });
    // Cursor — последний createdAt из предыдущей страницы; идём строго раньше,
    // чтобы не задублировать запись на стыке страниц при равных таймстампах
    // у пограничных строк (id-tiebreaker не используем — лишняя сложность).
    if (cursor) createdAtClauses.push({ [Op.lt]: cursor });
    if (createdAtClauses.length > 0) {
        (where as any).createdAt = createdAtClauses.length === 1 ? createdAtClauses[0] : { [Op.and]: createdAtClauses };
    }

    if (params.q && params.q.trim().length > 0) {
        const pattern = `%${escapeLike(params.q.trim())}%`;
        // ILIKE — case-insensitive, доступен только в Postgres; проект целиком
        // на Postgres, mysql-fallback не нужен.
        (where as any).message = { [Op.iLike]: pattern };
    }

    // limit + 1, чтобы понять есть ли следующая страница без COUNT(*).
    const rows = await SystemLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, limit) : rows).map(r => new SystemLogDto(r));
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt : null;

    return {
        items,
        nextCursor,
        hasMore,
    };
};

export default {
    list,
};
