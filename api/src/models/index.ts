import { Sequelize } from 'sequelize';
import User from './user';
import TokenModel from './token-model';
import RepairRequest from './repairRequest';
import Contractor from './contractor';
import TgUser from './tgUser';
import ApiKey from './apiKey';
import ObjectDir from './object';
import Unit from './unit';
import LegalEntity from './legalEntity';

const { DB_USER, DB_PWD, DB_HOST, DB_PORT, DB_NAME } = process.env;
export const models = {
    TgUser,
    User,
    TokenModel,
    Contractor,
    Unit,
    LegalEntity,
    ObjectDir,
    RepairRequest,
    ApiKey,
};

export const sequelize = new Sequelize(`${DB_NAME}`, `${DB_USER}`, `${DB_PWD}`, {
    host: `${DB_HOST}`,
    port: parseInt(`${DB_PORT}`),
    dialect: 'postgres',
    dialectOptions: {
        // multipleStatements: true,
        typeCast: true,
    },
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: true,
        underscored: true,
    },
    logging: false,
});
