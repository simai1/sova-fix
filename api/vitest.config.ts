import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./test/setup.ts'],
        testTimeout: 60_000,
        hookTimeout: 120_000,
        fileParallelism: false, // тесты делят БД
    },
});
