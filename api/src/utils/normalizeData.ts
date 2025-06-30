export function normalizeFileNames(input: string | null): string[] {
    if (!input) return [];
    try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Если input — не JSON-массив, значит это просто строка
    }
    return [input];
}