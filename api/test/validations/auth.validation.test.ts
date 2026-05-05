import { describe, it, expect } from 'vitest';
import { registerPublicSchema } from '../../src/validations/auth.validation';

describe('registerPublicSchema', () => {
    const valid = {
        body: { login: 'a@b.ru', password: 'pass1234', name: 'X', role: 3 },
        params: {},
        query: {},
    };

    it('пропускает валидный', () => {
        const { error } = registerPublicSchema.validate(valid);
        expect(error).toBeUndefined();
    });

    it('отклоняет невалидный email с русским сообщением', () => {
        const { error } = registerPublicSchema.validate({
            ...valid,
            body: { ...valid.body, login: 'not-email' },
        });
        expect(error).toBeDefined();
        expect(error!.details[0].message).toMatch(/корректн|email|почт/i);
    });

    it('отклоняет короткий пароль', () => {
        const { error } = registerPublicSchema.validate({
            ...valid,
            body: { ...valid.body, password: '123' },
        });
        expect(error).toBeDefined();
        expect(error!.details[0].message).toMatch(/паро/i);
    });

    it('отклоняет невалидную роль (не 3 и не 4)', () => {
        const { error } = registerPublicSchema.validate({
            ...valid,
            body: { ...valid.body, role: 2 },
        });
        expect(error).toBeDefined();
        expect(error!.details[0].message).toMatch(/роль/i);
    });
});
