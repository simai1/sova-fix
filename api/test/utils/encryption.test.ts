import { describe, it, expect } from 'vitest';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_COST, encrypt, isMatch, needsRehash } from '../../src/utils/encryption';

describe('encryption — bcrypt cost & rehash invariants (F-H3)', () => {
    it('BCRYPT_COST зафиксирован на 12 (OWASP 2024)', () => {
        expect(BCRYPT_COST).toBe(12);
    });

    it('encrypt() создаёт хеш с актуальным cost', async () => {
        const hash = await encrypt('password1234');
        expect(bcrypt.getRounds(hash)).toBe(12);
    });

    it('isMatch() корректно сравнивает пароль', async () => {
        const hash = await encrypt('password1234');
        expect(await isMatch('password1234', hash)).toBe(true);
        expect(await isMatch('wrong', hash)).toBe(false);
    });

    it('needsRehash() => true для устаревшего cost 8', async () => {
        // Хеш совместим с bcryptjs (использует префикс $2a$ для legacy и $2b$ для современного).
        const legacyHash = await bcrypt.hash('password1234', 8);
        expect(bcrypt.getRounds(legacyHash)).toBe(8);
        expect(needsRehash(legacyHash)).toBe(true);
    });

    it('needsRehash() => false для актуального cost 12', async () => {
        const currentHash = await encrypt('password1234');
        expect(needsRehash(currentHash)).toBe(false);
    });

    it('needsRehash() => false для невалидного хеша (без exception)', () => {
        expect(needsRehash('not-a-bcrypt-hash')).toBe(false);
    });
});
