import { Sequelize } from 'sequelize';
import { cartesianProduct, TABLE_FOR_REPORT } from '../utils/reports';
import ObjectDir from '../models/object';
import Unit from '../models/unit';
import LegalEntity from '../models/legalEntity';
import RepairRequest from '../models/repairRequest';
import Status from '../models/status';
import { AdditionalParametrsI, RelatedDataI, ReportInidicators } from '../types/reports';
import { Op } from 'sequelize';
import Contractor from '../models/contractor';
import ExtContractor from '../models/externalContractor';
import TgUser from '../models/tgUser';
import User from '../models/user';
import dayjs from 'dayjs';
import { RequestScope, scopeWhere } from './request-access.service';

const scopeObjectWhere = (scope: RequestScope, where: Record<string | symbol, any> = {}) =>
    scope.kind === 'all' ? where : { [Op.and]: [where, { id: { [Op.in]: scope.objectIds } }] };

const applyFilterData = (combined: any[], filterData: Record<string, any[]>) => {
    if (!filterData) return combined;

    return combined.filter(row => {
        return Object.entries(filterData).every(([key, values]) => {
            if (!values || !values.length) return false;

            const rowValue = row[key] ?? row[`${key}Id`] ?? row[key.toLowerCase()];
            return values.includes(rowValue);
        });
    });
};

const getTableReportData = async (
    parametrs: Record<string, boolean>,
    indicators: ReportInidicators,
    additionalParametrs: AdditionalParametrsI,
    filterData: any,
    scope: RequestScope
) => {
    const data: Record<string, any[]> = {};
    if (scope.kind === 'objects' && scope.objectIds.length === 0) {
        for (const [key, enabled] of Object.entries(parametrs)) {
            if (enabled && TABLE_FOR_REPORT[key]) data[key] = [];
        }
        return { resultRows: [], filterData: data };
    }
    const relatedKeys = ['legalEntity', 'unit', 'object'];
    const hasRelated = relatedKeys.some(key => parametrs[key]);

    const relatedData = hasRelated ? await loadRelatedData(parametrs, data, scope) : [];

    await buildParamData(parametrs, data, scope);

    let combined = cartesianProduct(data);

    combined = await filterRealBuilderContractorPairs(parametrs, combined, scope);

    let filtered = filterByRelations(parametrs, combined, relatedData);

    if (filterData) {
        filtered = applyFilterData(filtered, filterData);
    }

    let resultRows = await calculateIndicators(filtered, parametrs, indicators, additionalParametrs, scope);

    if (additionalParametrs.isResult) {
        resultRows = await addTotalRow(resultRows, parametrs, indicators, additionalParametrs, scope);
    }

    if (additionalParametrs?.dynamicsTypes && additionalParametrs?.dynamicsTypes?.length > 0) {
        resultRows = await addDynamics(resultRows, parametrs, indicators, additionalParametrs, filterData, scope);
    }
    return {
        resultRows,
        filterData: data,
    };
};

const getTotalCountRepairRequest = async (filters: Record<string, any>, scope: RequestScope) => {
    return RepairRequest.count({ where: scopeWhere(scope, filters) });
};

const getAllContractorsFromRequests = async (scope: RequestScope) => {
    const requests = await RepairRequest.findAll({
        attributes: ['id', 'contractorId', 'extContractorId', 'managerId', 'isExternal'],
        include: [
            {
                model: Contractor,
                attributes: ['id'],
                required: false,
                include: [
                    { model: User, attributes: ['id', 'name'] },
                    { model: TgUser, attributes: ['id', 'name'] },
                ],
            },
            { model: ExtContractor, attributes: ['id', 'name'], required: false },
            { model: TgUser, attributes: ['name'], required: false },
        ],
        raw: true,
        nest: true,
        where: scopeWhere(scope),
    });

    const result = new Map<
        string,
        {
            contractorId?: string | null;
            contractor?: string;
            extContractorId?: string | null;
            managerId?: string | null;
            isExternal?: boolean;
        }
    >();

    for (const r of requests) {
        if (r.managerId && r.TgUser?.name) {
            result.set(r.managerId, {
                managerId: r.managerId,
                contractor: r.TgUser.name,
            });
        } else if (r.ExtContractor?.id) {
            result.set(r.ExtContractor.id, {
                extContractorId: r.ExtContractor.id,
                contractor: r.ExtContractor.name,
            });
        } else if (r.Contractor?.id) {
            const cName = (r.Contractor as any).User?.name ?? (r.Contractor as any).TgUser?.name ?? null;
            result.set(r.Contractor.id, {
                contractorId: r.Contractor.id,
                contractor: cName ?? '',
            });
        } else if (!r.Contractor?.id && !r.ExtContractor?.id && !r.managerId && !r.isExternal) {
            result.set('none', {
                contractorId: null,
                managerId: null,
                extContractorId: null,
                contractor: 'Укажите подрядчика',
                isExternal: false,
            });
        } else if (!r.Contractor?.id && !r.ExtContractor?.id && !r.managerId && r.isExternal) {
            result.set('extNone', {
                contractorId: null,
                managerId: null,
                extContractorId: null,
                contractor: 'Внешний подрядчик',
                isExternal: true,
            });
        }
    }

    return Array.from(result.values());
};

export const loadRelatedData = async (
    params: Record<string, boolean>,
    data: Record<string, RelatedDataI[]>,
    scope: RequestScope
): Promise<RelatedDataI[]> => {
    const objects = await ObjectDir.findAll({
        include: [
            { model: Unit, attributes: ['id', 'name'], required: false },
            { model: LegalEntity, attributes: ['id', 'name'], required: false },
        ],
        attributes: ['id', 'name', 'unitId', 'legalEntityId'],
        raw: true,
        nest: true,
        where: scopeObjectWhere(scope),
    });

    const relatedData: RelatedDataI[] = [];
    const maps = {
        legalEntity: new Map<string, RelatedDataI>(),
        unit: new Map<string, RelatedDataI>(),
        object: new Map<string, RelatedDataI>(),
    };

    for (const obj of objects) {
        const item: RelatedDataI = {
            legalEntity: obj?.LegalEntity?.name || '',
            legalEntityId: obj?.LegalEntity?.id?.toString(),
            unit: obj?.Unit?.name || '',
            unitId: obj?.Unit?.id?.toString(),
            object: obj?.name || '',
            objectId: obj?.id?.toString(),
        };

        relatedData.push(item);

        if (params.legalEntity && item.legalEntity && item.legalEntityId) {
            maps.legalEntity.set(item.legalEntityId, {
                legalEntity: item.legalEntity,
                legalEntityId: item.legalEntityId,
            });
        }

        if (params.unit && item.unit && item.unitId) {
            maps.unit.set(item.unitId, { unit: item.unit, unitId: item.unitId });
        }

        if (params.object && item.object && item.objectId) {
            maps.object.set(item.objectId, { object: item.object, objectId: item.objectId });
        }
    }

    if (params.legalEntity) data.legalEntity = [...maps.legalEntity.values()];
    if (params.unit) data.unit = [...maps.unit.values()];
    if (params.object) data.object = [...maps.object.values()];

    return relatedData;
};

export const buildParamData = async (
    parametrs: Record<string, boolean>,
    data: Record<string, any[]>,
    scope: RequestScope
) => {
    for (const [key, enabled] of Object.entries(parametrs)) {
        if (!enabled || ['legalEntity', 'unit', 'object'].includes(key)) continue;
        const config = TABLE_FOR_REPORT[key];
        if (!config) continue;

        if (key === 'contractor') {
            data.contractor = await getAllContractorsFromRequests(scope);
            continue;
        }

        const attributes =
            key === 'builder'
                ? [[Sequelize.fn('DISTINCT', Sequelize.col(config.field)), config.field]]
                : ['id', config.field];

        const rows = await config.model.findAll({
            attributes,
            raw: true,
            ...(key === 'builder' ? { where: scopeWhere(scope) } : {}),
        });

        data[key] = rows.map((row: any) => ({ [`${key}Id`]: row.id, [key]: row[config.field] }));
    }
};

export const filterRealBuilderContractorPairs = async (
    parametrs: Record<string, boolean>,
    combined: any[],
    scope: RequestScope
) => {
    if (!(parametrs.builder && parametrs.contractor)) return combined;

    const realPairs = await RepairRequest.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('builder')), 'builder'],
            'contractorId',
            'extContractorId',
            'managerId',
        ],
        include: [{ model: TgUser, attributes: ['name'], required: false }],
        where: scopeWhere(scope, { builder: { [Op.ne]: null } }),
        raw: true,
        nest: true,
    });

    const validPairs = new Set<string>();
    for (const p of realPairs) {
        const builder = p.builder?.trim().toLowerCase();
        if (!builder) continue;

        if (p.contractorId) validPairs.add(`${builder}_${p.contractorId}`);
        if (p.extContractorId) validPairs.add(`${builder}_ext:${p.extContractorId}`);
        if (p.managerId) validPairs.add(`${builder}_manager:${p.managerId}`);
    }

    return combined.filter(row => {
        if (!row.builder) return false;
        if (row.contractor === 'Укажите подрядчика' && row.builder !== 'Укажите подрядчика') return false;
        if (row.contractor === 'Внешний подрядчик' && row.builder !== 'Внешний подрядчик') return false;

        const builder = String(row.builder).trim().toLowerCase();
        const keys: string[] = [];

        if (row.contractorId) keys.push(`${builder}_${row.contractorId}`);
        if (row.extContractorId) keys.push(`${builder}_ext:${row.extContractorId}`);
        if (row.managerId) keys.push(`${builder}_manager:${row.managerId}`);
        if (keys.length === 0) keys.push('none');

        return keys.some(k => validPairs.has(k) || k === 'none');
    });
};

export const filterByRelations = (parametrs: Record<string, boolean>, combined: any[], relatedData: RelatedDataI[]) => {
    const hasRelated = ['legalEntity', 'unit', 'object'].some(k => parametrs[k]);
    if (!hasRelated) return combined;
    if (relatedData.length === 0) return [];

    return combined.filter(row =>
        relatedData.some(
            r =>
                (!parametrs.legalEntity || r.legalEntity === row.legalEntity) &&
                (!parametrs.unit || r.unit === row.unit) &&
                (!parametrs.object || r.object === row.object)
        )
    );
};

export const calculateIndicators = async (
    filtered: any[],
    parametrs: Record<string, boolean>,
    indicators: ReportInidicators,
    additional: AdditionalParametrsI,
    scope: RequestScope
) => {
    const where: any = {};

    if (additional.dateStart && additional.dateEnd) {
        where.createdAt = {
            [Op.between]: [additional.dateStart, additional.dateEnd],
        };
    }
    const allRequestsCount = indicators.percentOfTotalCountRequest
        ? await RepairRequest.count({ where: scopeWhere(scope, where) })
        : 0;
    const result = await Promise.all(
        filtered.map(async row => {
            const filterIds = await buildFilterIds(row, parametrs, additional);
            return await buildIndicators(row, filterIds, indicators, allRequestsCount, scope);
        })
    );
    return result;
};

const buildFilterIds = async (row: any, parametrs: Record<string, boolean>, additional: AdditionalParametrsI) => {
    const filterIds: Record<string, any> = {};

    if (row.legalEntityId) filterIds.legalEntityId = row.legalEntityId;
    if (row.unitId) filterIds.unitId = row.unitId;
    if (row.objectId) filterIds.objectId = row.objectId;

    if (row.statusId) {
        const currentStatus = await Status.findByPk(row.statusId);
        filterIds.status = currentStatus?.number ?? 0;
    }

    if (row.urgency) filterIds.urgency = row.urgency;
    if (row.contractorId) filterIds.contractorId = row.contractorId;
    if (row.extContractorId) filterIds.extContractorId = row.extContractorId;
    if (row.managerId) filterIds.managerId = row.managerId;
    if (parametrs.contractor && !row.contractorId && !row.extContractorId && !row.managerId && !row.isExternal)
        filterIds.builder = 'Укажите подрядчика';
    if (parametrs.contractor && !row.contractorId && !row.extContractorId && !row.managerId && row.isExternal)
        filterIds.builder = 'Внешний подрядчик';
    if (row.builder) filterIds.builder = row.builder;

    if (additional.dateStart || additional.dateEnd) {
        filterIds.createdAt = {};
        if (additional.dateStart) filterIds.createdAt[Op.gte] = new Date(additional.dateStart);
        if (additional.dateEnd) filterIds.createdAt[Op.lte] = new Date(additional.dateEnd);
    }

    return filterIds;
};

const buildIndicators = async (
    row: any,
    filterIds: Record<string, any>,
    indicators: ReportInidicators,
    allRequestsCount: number,
    scope: RequestScope
) => {
    const result: Record<string, any> = { ...row };

    if (indicators.totalCountRequests || indicators.percentOfTotalCountRequest) {
        const count = await getTotalCountRepairRequest(filterIds, scope);
        if (indicators.totalCountRequests) result.totalCountRequests = count;
        if (indicators.percentOfTotalCountRequest)
            result.percentOfTotalCountRequest =
                allRequestsCount > 0 ? Number(((count / allRequestsCount) * 100).toFixed(1)) : 0;
    }

    if (indicators.budgetPlan && row.objectId) {
        const object = await ObjectDir.findOne({
            attributes: ['budgetPlan'],
            where: scopeObjectWhere(scope, { id: row.objectId }),
        });
        result.budgetPlan = object?.budgetPlan ?? null;
    }

    if (indicators.budget) {
        const budgets = await RepairRequest.findAll({
            where: scopeWhere(scope, filterIds),
            attributes: ['repairPrice'],
        });

        result.budget = budgets.length > 0 ? budgets.reduce((sum, r) => sum + (r.repairPrice ?? 0), 0) : 0;
    }

    if (indicators.percentOfBudgetPlan && row.objectId) {
        const object = await ObjectDir.findOne({
            attributes: ['budgetPlan'],
            where: scopeObjectWhere(scope, { id: row.objectId }),
        });
        const objectBudgetPlan = object?.budgetPlan ?? 0;
        const budgets = await RepairRequest.findAll({
            where: scopeWhere(scope, filterIds),
            attributes: ['repairPrice'],
        });
        const sumBudgets = budgets.length > 0 ? budgets.reduce((sum, r) => sum + (r.repairPrice ?? 0), 0) : 0;
        result.percentOfBudgetPlan =
            objectBudgetPlan > 0 ? Number(((sumBudgets / objectBudgetPlan) * 100).toFixed(0)) : 0;
    }

    if (indicators.closingSpeedOfRequests) {
        const requests = await RepairRequest.findAll({
            where: scopeWhere(scope, { ...filterIds, status: 3 }),
            attributes: ['daysAtWork'],
        });

        if (requests.length > 0) {
            const totalDays = requests.reduce((sum, r) => {
                const days = r.daysAtWork ?? 0;
                const corrected = days <= 0 ? 1 : days;
                return sum + corrected;
            }, 0);

            const avgDays = totalDays / requests.length;

            result.totalDaysAtWork = totalDays;
            result.totalRequestsCount = requests.length;
            result.closingSpeedOfRequests = Number(avgDays.toFixed(1));
        } else {
            result.totalDaysAtWork = 0;
            result.totalRequestsCount = 0;
            result.closingSpeedOfRequests = 0;
        }
    }

    return result;
};

export const addTotalRow = async (
    rows: any[],
    parametrs: Record<string, boolean>,
    indicators: ReportInidicators,
    additional: AdditionalParametrsI,
    scope: RequestScope
) => {
    if (rows.length === 0) return rows;

    const totalRow: Record<string, any> = {};
    const enabledKeys = Object.keys(parametrs).filter(k => parametrs[k]);

    for (const key of enabledKeys) totalRow[key] = key === enabledKeys[0] ? 'Итого' : '-';

    const getValue = (r: any, key: string) =>
        r[key] && typeof r[key] === 'object' ? (r[key].value ?? 0) : (r[key] ?? 0);

    const addField = (key: string, isPercent = false) => {
        const totalValue = rows.reduce((sum, r) => sum + getValue(r, key), 0);

        let value = isPercent ? Number(totalValue.toFixed(1)) : totalValue;

        if (isPercent) {
            if (value > 99 && value < 100.4) value = 100;
            value = Math.min(value, 100);
        }

        totalRow[key] = value;
    };

    if (indicators.totalCountRequests) addField('totalCountRequests');
    if (indicators.percentOfTotalCountRequest) addField('percentOfTotalCountRequest', true);
    if (indicators.closingSpeedOfRequests) {
        let totalDays = 0;
        let totalRequests = 0;

        for (const r of rows) {
            const { totalDaysAtWork, totalRequestsCount } = r;
            if (typeof totalDaysAtWork === 'number' && typeof totalRequestsCount === 'number') {
                totalDays += totalDaysAtWork;
                totalRequests += totalRequestsCount;
            }
        }

        const avg = totalRequests > 0 ? totalDays / totalRequests : 0;
        totalRow.closingSpeedOfRequests = Number(avg.toFixed(1));
    }
    if (indicators.budgetPlan) addField('budgetPlan');
    if (indicators.budget) addField('budget');

    if (indicators.percentOfBudgetPlan) {
        const totalBudgetPlan = await ObjectDir.sum('budgetPlan', {
            where: scopeObjectWhere(scope),
        });
        const totalBudget = await RepairRequest.sum('repairPrice', {
            where: scopeWhere(
                scope,
                additional.dateStart || additional.dateEnd
                    ? {
                          createdAt: {
                              ...(additional.dateStart ? { [Op.gte]: new Date(additional.dateStart) } : {}),
                              ...(additional.dateEnd ? { [Op.lte]: new Date(additional.dateEnd) } : {}),
                          },
                      }
                    : {}
            ),
        });

        const percent = totalBudgetPlan ? (totalBudget / totalBudgetPlan) * 100 : 0;
        totalRow['percentOfBudgetPlan'] = Number(percent.toFixed(1));
    }

    rows.push(totalRow);
    return rows;
};

export const addDynamics = async (
    rows: any[],
    parametrs: Record<string, boolean>,
    indicators: ReportInidicators,
    additional: AdditionalParametrsI,
    filterData: any,
    scope: RequestScope
) => {
    const { dynamicsTypes = [], dateStart, dateEnd } = additional;
    if (!dynamicsTypes.length) return rows;

    const baseDateStart = dateStart ? dayjs(dateStart) : dayjs();
    const baseDateEnd = dateEnd ? dayjs(dateEnd) : dayjs();

    const enabledIndicators = Object.entries(indicators)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

    if (!enabledIndicators.length) return rows;

    const prevPeriods = Object.fromEntries(
        await Promise.all(
            dynamicsTypes.map(async type => {
                let prevStart: dayjs.Dayjs;
                let prevEnd: dayjs.Dayjs;

                switch (type) {
                    case 'week':
                        prevStart = baseDateStart.subtract(7, 'days');
                        prevEnd = baseDateEnd.subtract(7, 'days');
                        break;
                    case 'month':
                        prevStart = baseDateStart.subtract(1, 'month');
                        prevEnd = baseDateEnd.subtract(1, 'month');
                        break;
                    case 'year':
                        prevStart = baseDateStart.subtract(1, 'year');
                        prevEnd = baseDateEnd.subtract(1, 'year');
                        break;
                    default:
                        return [type, []];
                }

                const data = (await getTableReportData(
                    parametrs,
                    indicators,
                    {
                        ...additional,
                        dateStart: prevStart.toISOString(),
                        dateEnd: prevEnd.toISOString(),
                        dynamicsTypes: [],
                        isResult: false,
                    },
                    filterData,
                    scope
                )) as { resultRows?: Record<string, any>[] };

                return [type, data?.resultRows ?? []];
            })
        )
    ) as Record<'week' | 'month' | 'year', any[]>;

    const newRows = structuredClone(rows);

    for (const row of newRows) {
        for (const type of dynamicsTypes) {
            const prevRows = prevPeriods[type];
            if (!prevRows?.length) continue;

            const prevRow = prevRows.find(prev =>
                Object.keys(parametrs)
                    .filter(k => parametrs[k])
                    .every(k => prev[k] === row[k])
            );

            if (!prevRow) continue;

            for (const key of enabledIndicators) {
                const currentValue = Number(row[key] ?? 0);
                const prevValue = Number(prevRow[key] ?? 0);
                const dynamics = prevValue === 0 ? 0 : Number(((currentValue / prevValue - 1) * 100).toFixed(1));

                row[`${key}${type[0].toUpperCase() + type.slice(1)}Dynamics`] = dynamics;
            }
        }
    }

    const totalRow = newRows[newRows.length - 1];
    if (totalRow && totalRow[Object.keys(parametrs)[0]] === 'Итого') {
        for (const type of dynamicsTypes) {
            const prevRows = prevPeriods[type];
            if (!prevRows?.length) continue;

            const prevTotal = (
                await addTotalRow(structuredClone(prevRows), parametrs, indicators, additional, scope)
            ).at(-1);
            if (!prevTotal) continue;

            for (const key of enabledIndicators) {
                const currentValue = Number(totalRow[key] ?? 0);
                const prevValue = Number(prevTotal[key] ?? 0);
                const dynamics = prevValue === 0 ? 0 : Number(((currentValue / prevValue - 1) * 100).toFixed(1));

                totalRow[`${key}${type[0].toUpperCase() + type.slice(1)}Dynamics`] = dynamics;
            }
        }
    }

    return newRows;
};

export default {
    getTableReportData,
};
