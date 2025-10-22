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
import dayjs from 'dayjs';

const getTableReportData = async (
    parametrs: Record<string, boolean>,
    indicators: ReportInidicators,
    additionalParametrs: AdditionalParametrsI
) => {
    try {
        const data: Record<string, any[]> = {};
        const relatedKeys = ['legalEntity', 'unit', 'object'];
        const hasRelated = relatedKeys.some(key => parametrs[key]);

        // 1. Загружаем связи
        const relatedData = hasRelated ? await loadRelatedData(parametrs, data) : [];

        // 2. Остальные параметры
        await buildParamData(parametrs, data);

        // 3. Комбинируем
        let combined = cartesianProduct(data);

        // 3.1 Фильтруем по парам builder ↔ contractor/manager/extContractor
        combined = await filterRealBuilderContractorPairs(parametrs, combined);

        // 4. Фильтруем по связям (legalEntity/unit/object)
        let filtered = filterByRelations(parametrs, combined, relatedData);

        // 5. Добавляем индикаторы
        let resultRows = await calculateIndicators(filtered, parametrs, indicators, additionalParametrs);

        // 6. Добавляем строку "Итого"
        if (additionalParametrs.isResult) {
            resultRows = addTotalRow(resultRows, parametrs, indicators);
        }

        // 7. Добавляем "Динамику"
        if (additionalParametrs?.dynamicsTypes && additionalParametrs?.dynamicsTypes?.length > 0) {
            resultRows = await addDynamics(resultRows, parametrs, indicators, additionalParametrs);
        }

        return resultRows;
    } catch (e) {
        console.error('getTableReportData error:', e);
        return [];
    }
};

// === Подсчёт количества заявок по id ===
const getTotalCountRepairRequest = async (filters: Record<string, any>) => {
    try {
        const count = await RepairRequest.count({ where: filters });
        return count;
    } catch (e) {
        console.error('getTotalCountRepairRequest error:', e);
        return 0;
    }
};

const getAllContractorsFromRequests = async () => {
    const requests = await RepairRequest.findAll({
        attributes: ['id', 'contractorId', 'extContractorId', 'managerId'],
        include: [
            { model: Contractor, attributes: ['id', 'name'], required: false },
            { model: ExtContractor, attributes: ['id', 'name'], required: false },
            { model: TgUser, attributes: ['name'], required: false },
        ],
        raw: true,
        nest: true,
    });

    const result = new Map<
        string,
        {
            contractorId?: string | null;
            contractor?: string;
            extContractorId?: string | null;
            managerId?: string | null;
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
            result.set(r.Contractor.id, {
                contractorId: r.Contractor.id,
                contractor: r.Contractor.name,
            });
        } else if (!r.Contractor?.id && !r.ExtContractor?.id && !r.managerId) {
            result.set('none', {
                contractorId: null,
                managerId: null,
                extContractorId: null,
                contractor: 'Укажите подрядчика',
            });
        }
    }

    return Array.from(result.values());
};

// === 1. Загружаем связи (legalEntity / unit / object) ===
export const loadRelatedData = async (
    params: Record<string, boolean>,
    data: Record<string, RelatedDataI[]>
): Promise<RelatedDataI[]> => {
    const objects = await ObjectDir.findAll({
        include: [
            { model: Unit, attributes: ['id', 'name'], required: false },
            { model: LegalEntity, attributes: ['id', 'name'], required: false },
        ],
        attributes: ['id', 'name', 'unitId', 'legalEntityId'],
        raw: true,
        nest: true,
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

// === 2. Загружаем остальные параметры ===
export const buildParamData = async (parametrs: Record<string, boolean>, data: Record<string, any[]>) => {
    for (const [key, enabled] of Object.entries(parametrs)) {
        if (!enabled || ['legalEntity', 'unit', 'object'].includes(key)) continue;
        const config = TABLE_FOR_REPORT[key];
        if (!config) continue;

        if (key === 'contractor') {
            data.contractor = await getAllContractorsFromRequests();
            continue;
        }

        const attributes =
            key === 'builder'
                ? [[Sequelize.fn('DISTINCT', Sequelize.col(config.field)), config.field]]
                : ['id', config.field];

        const rows = await config.model.findAll({
            attributes,
            raw: true,
        });

        data[key] = rows.map((row: any) => ({ [`${key}Id`]: row.id, [key]: row[config.field] }));
    }
};

// === 3.1 Ограничение builder ↔ contractor ===
export const filterRealBuilderContractorPairs = async (parametrs: Record<string, boolean>, combined: any[]) => {
    if (!(parametrs.builder && parametrs.contractor)) return combined;

    const realPairs = await RepairRequest.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('builder')), 'builder'],
            'contractorId',
            'extContractorId',
            'managerId',
        ],
        include: [{ model: TgUser, attributes: ['name'], required: false }],
        where: { builder: { [Op.ne]: null } },
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

        const builder = String(row.builder).trim().toLowerCase();
        const keys: string[] = [];

        if (row.contractorId) keys.push(`${builder}_${row.contractorId}`);
        if (row.extContractorId) keys.push(`${builder}_ext:${row.extContractorId}`);
        if (row.managerId) keys.push(`${builder}_manager:${row.managerId}`);
        if (keys.length === 0) keys.push('none');

        return keys.some(k => validPairs.has(k) || k === 'none');
    });
};

// === 4. Фильтрация по связям ===
export const filterByRelations = (parametrs: Record<string, boolean>, combined: any[], relatedData: RelatedDataI[]) => {
    const hasRelated = ['legalEntity', 'unit', 'object'].some(k => parametrs[k]);
    if (!hasRelated || relatedData.length === 0) return combined;

    return combined.filter(row =>
        relatedData.some(
            r =>
                (!parametrs.legalEntity || r.legalEntity === row.legalEntity) &&
                (!parametrs.unit || r.unit === row.unit) &&
                (!parametrs.object || r.object === row.object)
        )
    );
};

// === 5. Индикаторы ===
export const calculateIndicators = async (
    filtered: any[],
    parametrs: Record<string, boolean>,
    indicators: ReportInidicators,
    additional: AdditionalParametrsI
) => {
    const allRequestsCount = indicators.percentOfTotalCountRequest ? await RepairRequest.count() : 0;
    const result = await Promise.all(
        filtered.map(async row => {
            const filterIds = await buildFilterIds(row, parametrs, additional);
            return await buildIndicators(row, filterIds, indicators, allRequestsCount);
        })
    );
    return result;
};

// === 5.1 Хелпер: фильтры для RepairRequest ===
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
    if (parametrs.contractor && !row.contractorId && !row.extContractorId && !row.managerId)
        filterIds.builder = 'Укажите подрядчика';
    if (row.builder) filterIds.builder = row.builder;

    if (additional.dateStart || additional.dateEnd) {
        filterIds.createdAt = {};
        if (additional.dateStart) filterIds.createdAt[Op.gte] = new Date(additional.dateStart);
        if (additional.dateEnd) filterIds.createdAt[Op.lte] = new Date(additional.dateEnd);
    }

    return filterIds;
};

// === 5.2 Подсчёт всех индикаторов для строки ===
const buildIndicators = async (
    row: any,
    filterIds: Record<string, any>,
    indicators: ReportInidicators,
    allRequestsCount: number
) => {
    const result: Record<string, any> = { ...row };

    if (indicators.totalCountRequests || indicators.percentOfTotalCountRequest) {
        const count = await getTotalCountRepairRequest(filterIds);
        if (indicators.totalCountRequests) result.totalCountRequests = count;
        if (indicators.percentOfTotalCountRequest)
            result.percentOfTotalCountRequest =
                allRequestsCount > 0 ? Number(((count / allRequestsCount) * 100).toFixed(1)) : 0;
    }

    if (indicators.budgetPlan && row.objectId) {
        const object = await ObjectDir.findByPk(row.objectId, { attributes: ['budgetPlan'] });
        result.budgetPlan = object?.budgetPlan ?? null;
    }

    if (indicators.budget) {
        const budgets = await RepairRequest.findAll({ where: filterIds, attributes: ['repairPrice'] });
        result.budget =
            budgets.length > 0
                ? Number((budgets.reduce((sum, r) => sum + (r.repairPrice ?? 0), 0) / budgets.length).toFixed(0))
                : 0;
    }

    if (indicators.percentOfBudgetPlan && row.objectId) {
        const object = await ObjectDir.findByPk(row.objectId, { attributes: ['budgetPlan'] });
        const objectBudgetPlan = object?.budgetPlan ?? 0;
        const budgets = await RepairRequest.findAll({ where: filterIds, attributes: ['repairPrice'] });
        const avgBudget =
            budgets.length > 0 ? budgets.reduce((sum, r) => sum + (r.repairPrice ?? 0), 0) / budgets.length : 0;
        result.percentOfBudgetPlan =
            objectBudgetPlan > 0 ? Number(((avgBudget / objectBudgetPlan) * 100).toFixed(0)) : 0;
    }

    if (indicators.closingSpeedOfRequests) {
        const requests = await RepairRequest.findAll({
            where: { ...filterIds, completeDate: { [Op.ne]: null } },
            attributes: ['createdAt', 'completeDate'],
        });
        if (requests.length > 0) {
            const avgDays =
                requests.reduce((sum, r) => {
                    const created = r.createdAt ? new Date(r.createdAt).getTime() : null;
                    const completed = r.completeDate ? new Date(r.completeDate).getTime() : null;
                    if (!created || !completed) return sum;
                    return sum + (completed - created) / (1000 * 60 * 60 * 24);
                }, 0) / requests.length;
            result.closingSpeedOfRequests = Number(avgDays.toFixed(1));
        } else result.closingSpeedOfRequests = 0;
    }

    return result;
};

export const addTotalRow = (rows: any[], parametrs: Record<string, boolean>, indicators: ReportInidicators) => {
    if (rows.length === 0) return rows;

    const totalRow: Record<string, any> = {};
    const enabledKeys = Object.keys(parametrs).filter(k => parametrs[k]);

    for (const key of enabledKeys) totalRow[key] = key === enabledKeys[0] ? 'Итого' : '-';

    const getValue = (r: any, key: string) => (r[key] && typeof r[key] === 'object' ? r[key].value ?? 0 : r[key] ?? 0);

    const addField = (key: string, isPercent = false) => {
        const totalValue = rows.reduce((sum, r) => sum + getValue(r, key), 0);
        totalRow[key] = isPercent ? Number(totalValue.toFixed(1)) : totalValue;
    };

    if (indicators.totalCountRequests) addField('totalCountRequests');
    if (indicators.percentOfTotalCountRequest) addField('percentOfTotalCountRequest', true);
    if (indicators.budgetPlan) addField('budgetPlan');
    if (indicators.budget) addField('budget');
    if (indicators.percentOfBudgetPlan) addField('percentOfBudgetPlan', true);
    if (indicators.closingSpeedOfRequests) addField('closingSpeedOfRequests', true);

    rows.push(totalRow);
    return rows;
};

export const addDynamics = async (
    rows: any[],
    parametrs: Record<string, boolean>,
    indicators: ReportInidicators,
    additional: AdditionalParametrsI
) => {
    const { dynamicsTypes = [] } = additional;
    if (!dynamicsTypes.length) return rows;

    const today = dayjs();

    const shiftMap = {
        week: { value: 7, unit: 'day' },
        month: { value: 1, unit: 'month' },
        year: { value: 1, unit: 'year' },
    } as const;

    const enabledIndicators = Object.entries(indicators)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

    if (!enabledIndicators.length) return rows;

    // --- Загружаем данные предыдущих периодов
    const prevPeriods = Object.fromEntries(
        await Promise.all(
            dynamicsTypes.map(async type => {
                const shift = shiftMap[type];
                const prevStart = today.subtract(shift.value, shift.unit).startOf('day');
                const prevEnd = today.subtract(shift.value, shift.unit).endOf('day');

                const data = await getTableReportData(parametrs, indicators, {
                    ...additional,
                    dateStart: prevStart.toISOString(),
                    dateEnd: prevEnd.toISOString(),
                    dynamicsTypes: [],
                    isResult: false,
                });

                return [type, data];
            })
        )
    ) as Record<'week' | 'month' | 'year', any[]>;

    const newRows = structuredClone(rows);

    // --- Вычисляем динамику для обычных строк
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

                const dynamics =
                    prevValue === 0 ? 0 : Number((((currentValue - prevValue) / prevValue) * 100).toFixed(1));

                row[`${key}${type[0].toUpperCase() + type.slice(1)}Dynamics`] = dynamics;
            }
        }
    }

    // --- 📊 Вычисляем динамику для итоговой строки (последняя строка)
    const totalRow = newRows[newRows.length - 1];
    if (totalRow && totalRow[Object.keys(parametrs)[0]] === 'Итого') {
        for (const type of dynamicsTypes) {
            const prevRows = prevPeriods[type];
            if (!prevRows?.length) continue;

            // Находим соответствующую итоговую строку из прошлых данных
            const prevTotal = addTotalRow(structuredClone(prevRows), parametrs, indicators).at(-1);

            if (!prevTotal) continue;

            for (const key of enabledIndicators) {
                const currentValue = Number(totalRow[key] ?? 0);
                const prevValue = Number(prevTotal[key] ?? 0);

                const dynamics =
                    prevValue === 0 ? 0 : Number((((currentValue - prevValue) / prevValue) * 100).toFixed(1));

                totalRow[`${key}${type[0].toUpperCase() + type.slice(1)}Dynamics`] = dynamics;
            }
        }
    }

    return newRows;
};

export default {
    getTableReportData,
};
