const prepare = (obj: any) => {
    Object.keys(obj).forEach(k => {
        let val = obj[k];

        // если строка и содержит запятую → превращаем в массив
        if (typeof val === 'string' && val.includes(',')) {
            val = val.split(',').map(item => normalizeValue(item));
        } else {
            val = normalizeValue(val);
        }

        obj[k] = val;
    });
    return obj;
};

function normalizeValue(value: any) {
    if (value === null || value === undefined) return value;

    if (typeof value !== 'string') return value;

    const trimmed = value.trim();

    if (trimmed === 'null') return null;
    if (/^-?\d+$/.test(trimmed)) return Number(trimmed); // строго целое
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    return trimmed; // оставляем строкой
}

export default prepare;
