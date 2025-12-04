import { BuilderInterface, GetDirectoryCategoryResponse, ManagerI, NormalizedDataI } from './types';
import { ColumnI } from '../../types/column.type';

export const tableColumn: ColumnI[] = [
  { key: 'number', value: '№' },
  { key: 'name', value: 'Название' },
  { key: 'color', value: 'Цвет' },
  { key: 'customers', value: 'Доступ заказчикам' },
  { key: 'builder', value: 'Исполнитель' },
];

export const normalizeDataRender = (data: GetDirectoryCategoryResponse[]): NormalizedDataI[] => {
  const records: NormalizedDataI[] = [];

  data.map((record) => {
    let builder: string | null = null;

    if (!record?.isExternal && record.builder) builder = record.builder?.name;
    if (record.isExternal && record.builderExternal) builder = record.builderExternal?.name;
    if (record.isManager && record.manager) builder = record.manager.name;

    records.push({
      name: record.name,
      color: record.color,
      number: record.number,
      customers:
        record.customers && record?.customers?.length > 0
          ? record.customers?.map((customer) => customer.name).join(', ')
          : 'Все заказчики',
      builder: builder,
      id: record.id,
    });
  });

  return records;
};

export const getBuilderFun = (
  selectedRow: GetDirectoryCategoryResponse,
): BuilderInterface | ManagerI | null => {
  if (selectedRow.builder && selectedRow.builder.name !== '') {
    return selectedRow.builder; // BuilderInterface
  }

  if (selectedRow.manager && selectedRow.manager.name !== '') {
    return selectedRow.manager; // ManagerI
  }

  if (selectedRow.builderExternal && selectedRow.builderExternal.name !== '') {
    return selectedRow.builderExternal; // BuilderInterface
  }

  return null;
};
