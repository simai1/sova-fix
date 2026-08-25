import sequelize, { Op } from 'sequelize';

export type ContractorNameScope = 'request' | 'contractor';

/**
 * SQL-двойник getContractorName (utils/contractorName). NULLIF отбрасывает
 * пустые ФИО: у исполнителя, созданного через POST /auth/register, name = ''
 * до самой активации. Порядок источников менять только вместе с JS-версией —
 * по этому выражению идут сортировка, поиск и фильтры по имени.
 */
const effectiveNameExpr = (scope: ContractorNameScope = 'request') => {
    const prefix = scope === 'request' ? 'Contractor.' : '';
    const blankToNull = (column: string) => sequelize.fn('NULLIF', sequelize.col(column), '');
    return sequelize.fn(
        'COALESCE',
        blankToNull(`${prefix}User.name`),
        blankToNull(`${prefix}TgUser.name`),
        sequelize.col(`${prefix}User.login`)
    );
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
