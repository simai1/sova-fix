import type { LkFilterValue } from './FilterModal';

// Считает число активных фильтров для индикатора в кнопке «Фильтры».
// Используется в Customer/Contractor RequestsList.
export const countActiveFilters = (f: LkFilterValue): number => {
  let count = 0;
  if (f.unitId) count += 1;
  if (f.objectId) count += 1;
  if (f.statusId) count += 1;
  if (f.urgencyId) count += 1;
  // dateFrom + dateTo — один концептуальный фильтр «период».
  if (f.dateFrom || f.dateTo) count += 1;
  return count;
};
