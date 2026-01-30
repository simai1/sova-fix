import { Tag } from 'antd';
import { DefaultOptionType } from 'antd/es/select';

import { TContractor } from '../types/contractors.types';
import { TObject } from '../types/object.types';
import { TStatus } from '../types/status.types';
import { TUrgency } from '../types/urgency.types';

export const transformStatusListToOptions = (statusList: TStatus[]): DefaultOptionType[] => {
  return statusList.map((status) => ({
    key: status.id,
    value: status.id,
    label: (
      <Tag color={status.color} style={{ margin: 0 }}>
        {status.name}
      </Tag>
    ),

    labelText: status.name, // для поиска
  }));
};

export const transformUrgencyListToOptions = (urgencyList: TUrgency[]): DefaultOptionType[] => {
  return urgencyList.map((urgency) => ({
    key: urgency.id,
    value: urgency.id,
    label: (
      <Tag color={urgency.color} style={{ margin: 0 }}>
        {urgency.name}
      </Tag>
    ),

    labelText: urgency.name, // для поиска
  }));
};

export const transformDataContractorsToOptions = (
  dataContractors: TContractor[],
): DefaultOptionType[] => {
  return dataContractors.map((contractor) => ({
    key: contractor.id,
    label: contractor.name,
    value: contractor.id,
  }));
};

export const transformObjectsToOptions = (objects: TObject[]): DefaultOptionType[] => {
  return objects.map((objects) => ({
    key: objects.id,
    label: objects.name,
    value: objects.id,
  }));
};

export const normalizeFileNames = (input: string): string[] => {
  if (!input) return [];

  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // если это не JSON — значит просто строка
  }

  return [input];
};
