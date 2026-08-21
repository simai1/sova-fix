import Contractor from '../models/contractor';
import logger from '../utils/logger';
import { getContractorName, getContractorNameOrThrow } from '../utils/contractorName';

export default class ContractorDto {
    id!: string;
    name!: string;

    constructor(model: Contractor) {
        this.id = model.id;
        this.name = getContractorNameOrThrow(model);
    }

    /**
     * Версия для списочных выборок: осиротевшая запись (без живых User и TgUser)
     * отдаётся как null, а не роняет весь ответ. Конструктор бросает исключение —
     * в map по сотням заявок это превращает одну битую строку в 500 на всю ручку.
     */
    static fromModel(model: Contractor): ContractorDto | null {
        if (getContractorName(model) === null) {
            logger.warn(`[contractor] запись ${model.id} без userId/tgUserId — пропущена в выборке`);
            return null;
        }
        return new ContractorDto(model);
    }
}
