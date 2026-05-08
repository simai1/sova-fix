import SystemLog, { SystemLogLevel } from '../models/systemLog';

export default class SystemLogDto {
    id!: string;
    level!: SystemLogLevel;
    message!: string;
    service!: string;
    meta!: Record<string, unknown> | null;
    createdAt!: string;

    constructor(model: SystemLog) {
        this.id = model.id;
        this.level = model.level;
        this.message = model.message;
        this.service = model.service;
        this.meta = (model.meta as Record<string, unknown> | null) ?? null;
        this.createdAt = model.createdAt ? new Date(model.createdAt).toISOString() : new Date().toISOString();
    }
}
