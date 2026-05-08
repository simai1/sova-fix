import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import systemLogService from '../services/systemLog.service';

const getSystemLogs = catchAsync(async (req: Request, res: Response) => {
    const { level, from, to, q, limit, cursor } = req.query as Record<string, string | undefined>;
    const result = await systemLogService.list({
        level: level as 'info' | 'warn' | 'error' | 'all' | undefined,
        from,
        to,
        q,
        limit: limit !== undefined ? Number(limit) : undefined,
        cursor,
    });
    res.json(result);
});

export default {
    getSystemLogs,
};
