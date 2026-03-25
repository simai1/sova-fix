import { TContractor } from './contractors.types';
import { TSetting } from './settings.types';
import { TStatus } from './status.types';
import { TUrgency } from './urgency.types';
import { GetDirectoryCategoryResponse } from '../modules/DirectoryCategory/types';

export type BaseContextType = {
  selectRowDirectory: string;
  statusList: TStatus[];
  urgencyList: TUrgency[];
  dataContractors: TContractor[];
  selectedTr: string;
  directoryCategories: GetDirectoryCategoryResponse[];
  settingsList: TSetting[];
  UpdateTableReguest: () => void;
};

export type FlexibleContextType = { context: BaseContextType } & Record<string, any>;
