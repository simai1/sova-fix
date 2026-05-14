#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
/**
 * Страж глобальных CSS-leak'ов в *.module.scss.
 *
 * Почему: CSS Modules локально скопит ТОЛЬКО class/id-селекторы. Голый
 * top-level селектор на html-тег (`input { ... }`, `textarea { ... }`,
 * `button { ... }` и т.п.) внутри *.module.scss компилируется как ГЛОБАЛЬНОЕ
 * правило и утекает на весь проект. Пример инцидента: правило
 * `input { @media (max-width: 580px) { width: 300px !important } }` в
 * PopUpEditAppoint.module.scss резало ширину ВСЕХ инпутов на мобилке.
 *
 * Запуск:
 *   - `node scripts/check-css-modules-scope.cjs`         — прогон по проекту
 *   - `node scripts/check-css-modules-scope.cjs --self`  — только self-test
 *
 * Exit code: 0 если нарушений нет, 1 если найдены новые (не allowlisted) leak'и
 * или провалился self-test.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Allowlist намеренных глобальных стилизаций ──────────────────────────────
// Каждая запись — путь относительно front/src и список селекторов, которые
// ожидаемо top-level. Любое НОВОЕ нарушение фейлит тест.
// Идея: чтобы добавить запись, нужно сознательное действие (ревью PR'а),
// а не молчаливое расширение тех-долга.
const ALLOWLIST = {
    'components/Table/Table.module.scss': [
        'input[type="checkbox"]',
        'input[type="checkbox"]:before',
        'input[type="checkbox"]:checked:before',
        // Стилизация конкретных колонок таблицы — namespaced атрибутом name,
        // снижает риск глобального leak'а.
        'td[name="fileName"], td[name="commentAttachment"], td[name="checkPhoto"]',
    ],
};

// ── Парсер top-level селекторов ──────────────────────────────────────────────
/**
 * Возвращает массив селекторов (без `{`) для правил, объявленных на самом
 * верхнем уровне SCSS-файла. Корректно учитывает `{ }` nesting, поэтому правила
 * внутри классов не попадают (даже если фигурно вложены через `&` или media).
 *
 * Не идеальный SCSS-парсер — но достаточный для класса нарушений, который мы
 * ловим: голый тег на верхнем уровне.
 */
function extractTopLevelSelectors(source) {
    // Снимаем строки и комментарии — внутри них могут быть `{ }` для interpolation.
    let s = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/'(?:\\'|[^'])*'/g, "''")
        .replace(/"(?:\\"|[^"])*"/gm, (m) => '"' + ' '.repeat(m.length - 2) + '"');

    const selectors = [];
    let depth = 0;
    let buf = '';
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '{') {
            if (depth === 0) {
                const sel = buf.trim();
                if (sel) selectors.push(sel);
            }
            depth++;
            buf = '';
        } else if (c === '}') {
            depth = Math.max(0, depth - 1);
            if (depth === 0) buf = '';
        } else if (depth === 0) {
            if (c === ';') {
                // top-level @use/@forward/@import — игнорим (declaration, not rule)
                buf = '';
                continue;
            }
            buf += c;
        }
    }
    return selectors;
}

/**
 * true, если селектор валидно scope'ится — начинается с класса, id, &, :global,
 * :local или @-правила. False — голый html-тег / attr selector на верхнем уровне.
 */
function isScoped(selector) {
    const s = selector.trim();
    if (!s) return true;
    if (s.startsWith('@')) return true; // @media, @supports, @at-root и т.п.
    // Берём первую часть до combinator'а (space/>/+/~) или запятой.
    const first = s.split(/[\s,>+~]/)[0];
    return (
        first.startsWith('.') ||
        first.startsWith('#') ||
        first.startsWith('&') ||
        first.startsWith(':global') ||
        first.startsWith(':local')
    );
}

function findLeaks(source) {
    return extractTopLevelSelectors(source).filter((sel) => !isScoped(sel));
}

/**
 * Приводит селектор к нормализованной форме: содержимое кавычек → пустота.
 * Парсер extractTopLevelSelectors маскирует строки пробелами (защита от `{` в
 * литералах), поэтому allowlist сравниваем после того же преобразования —
 * иначе attr-селекторы вида `input[type="checkbox"]` не сматчатся.
 */
function normalizeSelector(sel) {
    return sel
        .replace(/'(?:\\'|[^'])*'/g, "''")
        .replace(/"(?:\\"|[^"])*"/g, '""')
        .replace(/\s+/g, ' ')
        .trim();
}

// ── Self-test ────────────────────────────────────────────────────────────────
const SELF_TESTS = [
    {
        name: 'голый input — leak',
        scss: `input { color: red; }`,
        expected: ['input'],
    },
    {
        name: 'класс — ok',
        scss: `.root { color: red; }`,
        expected: [],
    },
    {
        name: 'вложенный input в классе — ok',
        scss: `.root { input { color: red; } }`,
        expected: [],
    },
    {
        name: 'top-level media с input внутри — ok (media — это @-правило)',
        scss: `@media (max-width: 580px) { input { width: 300px; } }`,
        expected: [],
    },
    {
        name: 'двойной leak (input + textarea)',
        scss: `input { height: 16px; } textarea { width: 100%; }`,
        expected: ['input', 'textarea'],
    },
    {
        name: 'reproduction бага PopUpEditAppoint',
        scss: `
.someClass { color: red; }
input {
  @media (max-width: 580px) {
    width: 300px !important;
  }
}
textarea {
  width: 270px !important;
}
        `,
        expected: ['input', 'textarea'],
    },
    {
        name: ':global wrapper — ok',
        scss: `:global(.foo) input { color: red; }`,
        expected: [],
    },
    {
        name: 'комбинатор — голый html-тег слева, всё равно leak',
        scss: `input > span { color: red; }`,
        expected: ['input > span'],
    },
    {
        name: 'attr-селектор — leak',
        scss: `[data-foo] { color: red; }`,
        expected: ['[data-foo]'],
    },
    {
        name: 'комментарий с фигурными скобками не путает парсер',
        scss: `/* { input { broken } } */ .root { color: red; }`,
        expected: [],
    },
    {
        name: '@use top-level — игнорим',
        scss: `@use "@/styles/index" as *; .root { color: red; }`,
        expected: [],
    },
];

function runSelfTests() {
    let failed = 0;
    for (const t of SELF_TESTS) {
        const got = findLeaks(t.scss);
        const eq =
            got.length === t.expected.length &&
            got.every((g, i) => g === t.expected[i]);
        if (!eq) {
            failed++;
            console.error(`✗ ${t.name}`);
            console.error(`  expected: ${JSON.stringify(t.expected)}`);
            console.error(`  got:      ${JSON.stringify(got)}`);
        } else {
            console.log(`✓ ${t.name}`);
        }
    }
    return failed;
}

// ── Walker по проекту ────────────────────────────────────────────────────────
function walk(dir, files = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (name === 'node_modules' || name === 'dist' || name === 'build') continue;
            walk(full, files);
        } else if (name.endsWith('.module.scss')) {
            files.push(full);
        }
    }
    return files;
}

function relativeToSrc(absPath, srcRoot) {
    return path.relative(srcRoot, absPath).replace(/\\/g, '/');
}

function checkProject(srcRoot) {
    const files = walk(srcRoot);
    let newLeaks = 0;
    const report = [];

    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        const leaks = findLeaks(source);
        if (leaks.length === 0) continue;

        const rel = relativeToSrc(file, srcRoot);
        const allowed = (ALLOWLIST[rel] || []).map(normalizeSelector);
        const unexpected = leaks.filter((l) => !allowed.includes(normalizeSelector(l)));

        if (unexpected.length > 0) {
            newLeaks += unexpected.length;
            report.push({ file: rel, unexpected, allowed });
        }
    }

    if (newLeaks > 0) {
        console.error('');
        console.error('✗ Найдены глобальные CSS-leak\'и в *.module.scss:');
        console.error('');
        for (const r of report) {
            console.error(`  ${r.file}`);
            for (const sel of r.unexpected) {
                console.error(`    × top-level селектор: \`${sel} { ... }\``);
            }
            console.error(
                `    fix: оберни правила в локальный класс (.root, .container, ...)\n` +
                    `         и применяй этот класс в jsx — тогда правила scopятся.`,
            );
            console.error('');
        }
        console.error(`Всего нарушений: ${newLeaks}`);
        console.error(
            'Намеренные стилизации добавляй в ALLOWLIST в scripts/check-css-modules-scope.cjs ' +
                '(требует код-ревью).',
        );
    }
    return newLeaks;
}

// ── Entry point ──────────────────────────────────────────────────────────────
function main() {
    const args = new Set(process.argv.slice(2));
    const selfOnly = args.has('--self');

    console.log('— self-test —');
    const selfFailed = runSelfTests();
    if (selfFailed > 0) {
        console.error(`\n✗ ${selfFailed} self-test(s) failed — парсер сломан, исправь до запуска`);
        process.exit(1);
    }
    console.log('');

    if (selfOnly) {
        console.log('self-test only: ok');
        return;
    }

    const srcRoot = path.resolve(__dirname, '..', 'src');
    console.log(`— scan ${srcRoot} —`);
    const projectLeaks = checkProject(srcRoot);

    if (projectLeaks > 0) {
        process.exit(1);
    }
    console.log('✓ глобальных CSS-leak\'ов в *.module.scss не найдено');
}

main();
