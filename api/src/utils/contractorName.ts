import Contractor from '../models/contractor';

/**
 * Первое непустое значение. Пустая строка — не «имя»: POST /auth/register
 * создаёт исполнителя с name: '' (ФИО он вводит сам при активации), и через
 * обычный ?? такая запись доехала бы до справочника безымянной строкой.
 *
 * Порядок источников обязан совпадать с SQL-выражением в contractorNameFilter,
 * иначе список сортируется по одному значению, а показывает другое.
 */
const firstFilled = (...values: Array<string | null | undefined>): string | null =>
    values.find(value => typeof value === 'string' && value.trim() !== '') ?? null;

export const getContractorName = (contractor: Contractor | null | undefined): string | null => {
    if (!contractor) return null;
    return firstFilled(contractor.User?.name, contractor.TgUser?.name, contractor.User?.login);
};

export const getContractorNameOrThrow = (contractor: Contractor): string => {
    const name = getContractorName(contractor);
    if (name === null) {
        throw new Error(
            `Contractor ${contractor.id} has no derivable name. ` +
                `Likely cause: the query forgot include: [User, TgUser] (используй contractorInclude). ` +
                `Менее вероятно: orphan-запись в contractors без userId и tgUserId — таких быть не должно после миграции 2026-05-10.`
        );
    }
    return name;
};
