import { LkObject } from '@/API/rtkQuery/lk.api';

export type LkUnitOption = {
  id: string;
  name: string;
};

// Derive подразделений из списка объектов юзера. Бэкенд не отдаёт
// отдельным эндпоинтом /lk/units/my — для типичного юзера ≤ 50 объектов
// и ≤ 10 подразделений, дополнительный запрос — overhead. Сортируем по
// русской локали через Intl Collator.
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
