import sequelize, { Op } from 'sequelize';

export type ContractorNameScope = 'request' | 'contractor';

const effectiveNameExpr = (scope: ContractorNameScope = 'request') => {
    const prefix = scope === 'request' ? 'Contractor.' : '';
    return sequelize.fn('COALESCE', sequelize.col(`${prefix}User.name`), sequelize.col(`${prefix}TgUser.name`));
};

export const contractorNameIn = (values: unknown[], scope: ContractorNameScope = 'request') =>
    sequelize.where(effectiveNameExpr(scope), { [Op.in]: values as any });

export const contractorNameNotIn = (values: unknown[], scope: ContractorNameScope = 'request') =>
    sequelize.where(effectiveNameExpr(scope), { [Op.notIn]: values as any });

export const contractorNameILike = (pattern: string, scope: ContractorNameScope = 'request') =>
    sequelize.where(effectiveNameExpr(scope), { [Op.iLike]: pattern });

export const contractorNameIsNull = (scope: ContractorNameScope = 'request') =>
    sequelize.where(effectiveNameExpr(scope), { [Op.is]: null as any });

export const contractorNameIsNotNull = (scope: ContractorNameScope = 'request') =>
    sequelize.where(effectiveNameExpr(scope), { [Op.not]: null as any });

export const contractorNameOrderExpr = effectiveNameExpr;
