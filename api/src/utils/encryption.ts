import * as bcrypt from 'bcryptjs';

export const encrypt = async (value: string) => {
    return await bcrypt.hash(value, 8);
};

export const isMatch = async (value: string, checkValue: string) => {
    return bcrypt.compare(value, checkValue);
};
