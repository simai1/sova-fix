import Contractor from '../models/contractor';

// Имя контрактора всегда производное от связанного User (web-flow) или TgUser (legacy bot-flow).
// Колонки contractors.name больше нет — отдельного поля для имени у Contractor не существует.
//
// Есть два варианта получения имени:
//
// - getContractorName(c): string | null — мягкий, возвращает null если ассоциации не загружены.
//   Использовать в логировании, опциональных полях, лейблах с fallback.
//
// - getContractorNameOrThrow(c): string — строгий, падает с ошибкой если имя не выводится.
//   Использовать в DTO, которые отдают имя клиенту: молча отдать undefined вместо реального имени —
//   это маскирование бага (либо забыли include [User, TgUser] в запросе, либо orphan-запись в БД).
//   Лучше упасть на сервере и сразу заметить, чем рисовать пустую ячейку у пользователя.
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
