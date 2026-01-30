import { TStatus } from '../types/status.types';
import { TUrgency } from '../types/urgency.types';

export const getStatusByName = (statusNumber: number, statusList: TStatus[]): TStatus | null => {
  return statusList.find((s) => s.number === statusNumber) ?? null;
};

export const getUrgencyByName = (urgencyName: string, urgencyList: TUrgency[]): TUrgency | null => {
  return urgencyList.find((u) => u.name === urgencyName) ?? null;
};

export const getStatusById = (statusId: string, statusList: TStatus[]): TStatus | null => {
  return statusList.find((s) => s.id === statusId) ?? null;
};

export const getUrgencyById = (urgencyId: string, urgencyList: TUrgency[]): TUrgency | null => {
  return urgencyList.find((u) => u.id === urgencyId) ?? null;
};
