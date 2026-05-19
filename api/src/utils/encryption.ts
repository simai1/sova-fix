import * as bcrypt from 'bcryptjs';

export const BCRYPT_COST = 12;

export const encrypt = async (value: string) => {
    return await bcrypt.hash(value, BCRYPT_COST);
};

export const isMatch = async (value: string, checkValue: string) => {
    return bcrypt.compare(value, checkValue);
};

export const needsRehash = (hash: string): boolean => {
    try {
        return bcrypt.getRounds(hash) < BCRYPT_COST;
    } catch {
        return false;
    }
};
