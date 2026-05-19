export function normalizeFileNames(input: string | null): string[] {
    if (!input) return [];
    try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        return [input];
    }
    return [input];
}
