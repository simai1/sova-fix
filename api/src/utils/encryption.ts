import * as bcrypt from 'bcryptjs';

// 12 раундов — рекомендация OWASP 2024 для server-side bcrypt (8 ломается на
// современном GPU за разумное время). Для миграции существующих 8-раундовых
// хешей используем lazy-rehash в auth.service.login.
export const BCRYPT_COST = 12;

export const encrypt = async (value: string) => {
    return await bcrypt.hash(value, BCRYPT_COST);
};

export const isMatch = async (value: string, checkValue: string) => {
    return bcrypt.compare(value, checkValue);
};

// Возвращает true, если хеш создан с меньшим cost'ом, чем актуальный.
// Используем для lazy-rehash при успешном login: пользователь вводит
// plain-пароль один раз, мы пересчитываем хеш «бесплатно».
export const needsRehash = (hash: string): boolean => {
    try {
        return bcrypt.getRounds(hash) < BCRYPT_COST;
    } catch {
        return false;
    }
};
