// Общий список вариантов сортировки для списка заявок (Contractor + Customer).
// 6 опций по UI design-doc'у §D: дата ↓/↑, срочность ↓/↑, статус ↓/↑.
// Бэкенд по design'у поддерживает sort=createdAt|urgency|status (через
// Urgency.number / Status.number, не по UUID).
export type SortOption = {
  label: string;
  sort: string;
  order: 'asc' | 'desc';
};

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Сначала новые', sort: 'createdAt', order: 'desc' },
  { label: 'Сначала старые', sort: 'createdAt', order: 'asc' },
  { label: 'Срочность ↓', sort: 'urgency', order: 'desc' },
  { label: 'Срочность ↑', sort: 'urgency', order: 'asc' },
  { label: 'Статус ↓', sort: 'status', order: 'desc' },
  { label: 'Статус ↑', sort: 'status', order: 'asc' },
];
