import { LkObject } from '@/API/rtkQuery/lk.api';

export type LkUnitOption = {
  id: string;
  name: string;
};

export const deriveUnitsFromObjects = (objects: LkObject[]): LkUnitOption[] => {
  const map = new Map<string, string>();
  objects.forEach((o) => {
    if (o.unit?.id && o.unit.name) {
      map.set(o.unit.id, o.unit.name);
    }
  });
  const list = Array.from(map, ([id, name]) => ({ id, name }));
  list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return list;
};
