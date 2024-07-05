export function mapObjectKeys(object: any) {
    return Object.keys(object).reduce(
        (acc, k) => ({
            ...acc,
            [object[k]]: k,
        }),
        {}
    );
}
