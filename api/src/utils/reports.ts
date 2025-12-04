import ObjectDir from '../models/object';
import Status from '../models/status';
import Unit from '../models/unit';
import Contractor from '../models/contractor';
import Urgency from '../models/urgency';
import LegalEntity from '../models/legalEntity';
import RepairRequest from '../models/repairRequest';

export const TABLE_FOR_REPORT: Record<string, any> = {
    unit: { model: Unit, as: 'Unit', field: 'name', name: 'unit' },
    object: { model: ObjectDir, as: 'Object', field: 'name', name: 'object' },
    contractor: { model: Contractor, as: 'Contractor', field: 'name', name: 'contractor' },
    status: { model: Status, as: 'Status', field: 'name', name: 'status' },
    urgency: { model: Urgency, as: 'Urgency', field: 'name', name: 'urgency' },
    legalEntity: { model: LegalEntity, as: 'LegalEntity', field: 'name', name: 'legalEntity' },
    builder: { model: RepairRequest, as: '', field: 'builder', name: 'builder' }
};

/**
 * Генерирует декартово произведение массивов объектов
 */
export function cartesianProduct(arrays: Record<string, any[]>): Record<string, any>[] {
    const keys = Object.keys(arrays);
    if (keys.length === 0) return [];

    // Начинаем с первого массива
    let result = arrays[keys[0]].map(item => ({ ...item }));

    for (let i = 1; i < keys.length; i++) {
        const key = keys[i];
        const newResult: Record<string, any>[] = [];
        for (const row of result) {
            for (const item of arrays[key]) {
                newResult.push({ ...row, ...item });
            }
        }
        result = newResult;
    }

    return result;
}
