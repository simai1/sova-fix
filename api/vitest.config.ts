import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // globalSetup — ОДИН раз на весь test-run (ДО форка workers): тяжёлый
        // sync({ alter: true }) + seedInitialSettings. setupFiles — на каждый
        // worker/файл: только инициализация JS-классов моделей (быстро).
        // Без этого split каждый из 13+ файлов тратил бы ~3 минуты на
        // повторный sync уже актуальной схемы.
        globalSetup: ['./test/global-setup.ts'],
        setupFiles: ['./test/setup.ts'],
        testTimeout: 60_000,
        // hookTimeout всё равно держим высоким на случай запуска БЕЗ globalSetup
        // (например, если кто-то вручную дёрнет vitest run на отдельном файле).
        hookTimeout: 300_000,
        fileParallelism: false, // тесты делят БД
    },
});
