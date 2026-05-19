import Contractor from '../models/contractor';

export const getContractorName = (contractor: Contractor | null | undefined): string | null => {
    if (!contractor) return null;
    return contractor.User?.name ?? contractor.TgUser?.name ?? null;
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
