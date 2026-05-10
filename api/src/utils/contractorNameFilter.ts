import sequelize, { Op } from 'sequelize';

// Когда Contractor загружен с include [User, TgUser], его «эффективное» имя для фильтров
// и сортировки — COALESCE(User.name, TgUser.name). Колонки contractors.name больше нет.
//
// Используем sequelize.where(...) обёртку, чтобы Sequelize сгенерировал
// COALESCE("...->User"."name", "...->TgUser"."name") <op> value.
//
// Важно: запрос обязан содержать include соответствующих моделей (User, TgUser),
// иначе SQL не будет иметь нужных алиасов.
//
// Scope определяет, как Sequelize резолвит путь к колонкам:
// - 'request' (по умолчанию) — корень `RepairRequest`, путь `Contractor.User.name`/
//   `Contractor.TgUser.name`. Используется в `request.service.ts` и
//   `contractor.service.ts::getContractorsRequests/Itinerary`.
// - 'contractor' — корень сам `Contractor`, путь `User.name`/`TgUser.name`. Используется
//   в `contractor.service.ts::getAllContractors`.
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

// Сырая COALESCE-колонка для ORDER BY.
export const contractorNameOrderExpr = effectiveNameExpr;
