const prepare = (obj: any) => {
    Object.keys(obj).forEach(k => {
        if (obj[k].includes(','))
            obj[k] = obj[k].split(',').map((item: any) => (Number.isInteger(parseInt(item)) ? parseInt(item) : item));
        else if (Number.isInteger(parseInt(obj[k]))) obj[k] = parseInt(obj[k]);
        else if (obj[k] === 'null') obj[k] = null;
    });
    return obj;
};

export default prepare;
