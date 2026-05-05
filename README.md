CRM "SOVA-fix - система управления ремонтом, эксплуатацией и техническим обслуживанием оборудования и помещений"

# CRM SOVA-fix

## Описание
Система предназначена для управления ремонтом, эксплуатацией и техническим обслуживанием оборудования и помещений, Так же есть блок ТО предназначенный для контроля и отслеживания технического состояния оборудования на объектах

## Установка и запуск
В проекте три директории под frontend (front), backend (api) и Tg бота (bot).

Версия Node 20.10.0
### Запуск backend:
Выполнить в директории `api`:
```bash
npm i
```
В директории должен находиться файл `.env.${NODE_ENV}.local` (например, `.env.development.local`), созданный по примеру `.env.example`. Загрузчик подтягивает файл по `NODE_ENV`, поэтому `.env` без суффикса игнорируется.

Запуск:
```bash
npm run dev
```

### Запуск frontend:
Выполнить в директории `front`:
```bash
npm i
```
Запуск:
```bash
npm run dev    # vite dev server (http://localhost:3002)
npm run build  # vite build → ./build/
```

## Структура проекта
Монорепозиторий: `api/` (Node/TypeScript backend), `front/` (React 19 SPA на Vite), `bot/` (Python Telegram-бот).

### Frontend (`front/`)
- `public/` — статика, `index.html`.
- `src/`
  - `API/` — axios-обёртки (`API.js`) и RTK Query API (`rtkQuery/*.api.ts`).
  - `components/` — переиспользуемые UI-блоки.
  - `pages/` — страницы (например, `AdminPages/`, `Login/`).
  - `modules/` — крупные доменные блоки (`UsersDirectory`, `BusinessUnitReference`, …).
  - `store/` — Redux Toolkit + redux-persist.
  - `styles/` — SCSS, миксины, переменные.
  - `UI/` — низкоуровневые UI-кирпичики (включая обёртки Ant Design).
  - `App.jsx` — главный контейнер с роутингом и контекстами.
  - `context.ts` — `DataContext` для общего стейта.
 
## Ветки
* main - основная ветка.
* test - ветка для тестового сервера.
* feature/* - ветки под определенные фичи.
* fix/* - ветки под определенные фиксы.
