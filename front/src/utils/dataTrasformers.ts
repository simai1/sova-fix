import { DefaultOptionType } from 'antd/es/select';

import { TContractor } from '../types/contractors.types';
import { TStatus } from '../types/status.types';
import { TUrgency } from '../types/urgency.types';
import { TObject } from '../types/object.types';

export const transformStatusListToOptions = (statusList: TStatus[]): DefaultOptionType[] => {
  return statusList.map((status) => ({ key: status.id, label: status.name, value: status.id }));
};

export const transformUrgencyListToOptions = (urgencyList: TUrgency[]): DefaultOptionType[] => {
  return urgencyList.map((urgency) => ({
    key: urgency.id,
    label: urgency.name,
    value: urgency.id,
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
