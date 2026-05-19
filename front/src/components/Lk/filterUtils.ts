import type { LkFilterValue } from './FilterModal';

export const countActiveFilters = (f: LkFilterValue): number => {
  let count = 0;
  if (f.unitId) count += 1;
  if (f.objectId) count += 1;
  if (f.statusId) count += 1;
  if (f.urgencyId) count += 1;
  if (f.dateFrom || f.dateTo) count += 1;
  return count;
};
