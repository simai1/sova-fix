import TgUserObject from '../models/tgUserObject';
import TgUserDto from './tgUser.dto';
import ObjectDto from './object.dto';
import { Model } from 'sequelize';

export class CreateTgUserObjectDto {
    tg_user_id!: string;
    object_id!: string;
}

export default class TgUserObjectDto {
    id!: string;
    tg_user_id!: string;
    object_id!: string;
    createdAt!: Date;
    updatedAt!: Date;
    tgUser?: TgUserDto | null;
    object?: ObjectDto | null;

    constructor(model: Model | any) {
        this.id = model.id;
        this.tg_user_id = model.tg_user_id;
        this.object_id = model.object_id;
        this.createdAt = model.createdAt;
        this.updatedAt = model.updatedAt;
        // Добавляем связанные объекты, если они есть
        this.tgUser = model.TgUser ? new TgUserDto(model.TgUser) : null;
        this.object = model.ObjectDir ? new ObjectDto(model.ObjectDir) : null;
    }
} 