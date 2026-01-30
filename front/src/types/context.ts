import { TContractor } from './contractors.types';
import { TStatus } from './status.types';
import { TUrgency } from './urgency.types';

export type BaseContextType = {
  selectRowDirectory: string;
  statusList: TStatus[];
  urgencyList: TUrgency[];
  dataContractors: TContractor[];
  selectedTr: string;
  UpdateTableReguest: () => void;
};

export type FlexibleContextType = { context: BaseContextType } & Record<string, any>;
