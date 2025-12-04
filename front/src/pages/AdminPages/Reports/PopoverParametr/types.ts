import { FilterDataI, ReportsComponentProps } from '../types';

export interface PopoverParametrProps extends Pick<
  ReportsComponentProps,
  'handleSetFilterDataValues'
> {
  parametr: keyof FilterDataI;
}
