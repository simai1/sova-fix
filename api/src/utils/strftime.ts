import strftime from 'strftime';

// Все бизнес-даты в проекте — в TZ Europe/Moscow (см. CLAUDE.md). Node в Docker
// стартует в UTC, поэтому без явного offset'а strftime сдвигает дату на сутки
// назад при значениях, попавших на «начало суток МСК» (например, выбор «Дата
// выезда» в ЛК Исполнителя приходит как 2026-05-11T21:00:00Z → форматируется
// как 11.05 вместо 12.05).
const strftimeMsk = strftime.timezone('+0300');

export default strftimeMsk;
