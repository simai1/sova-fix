import { CheckboxOptionType } from 'antd';

import { FilterDataI } from '../types';

export const findParametr = (
  parametr: keyof FilterDataI,
  filterData: FilterDataI,
): CheckboxOptionType[] => {
  const paramList = filterData[parametr];
  if (!paramList || !Array.isArray(paramList)) return [];

  return paramList.map((item: any) => {
    switch (parametr) {
      case 'unit':
        return { label: item.unit, value: item.unit };
      case 'object':
        return { label: item.object, value: item.object };
      case 'contractor':
        return {
          label: item.contractor,
          value: item.contractor,
        };
      case 'builder':
        return { label: item.builder, value: item.builder };
      case 'status':
        return { label: item.status, value: item.status };
      case 'urgency':
        return { label: item.urgency, value: item.urgency };
      case 'legalEntity':
        return { label: item.legalEntity, value: item.legalEntity };
      default:
        return { label: item.toString(), value: item };
    }
  });
};
