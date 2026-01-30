import { FormInstance } from 'antd';
import { Dayjs } from 'dayjs';

export interface IRequestEditModalContainer {
  open: boolean;
  handleCloseModal: () => void;
}

export interface IRequestEditModalComponent extends Pick<
  IRequestEditModalContainer,
  'open' | 'handleCloseModal'
> {
  form: FormInstance<IRepairEditForm>;
}

export interface IRepairEditForm {
  builder: string | null;
  contractor: string | null;
  comment: string | null;
  fileName: string | null;
  legalEntity: string | null;
  objectId: string;
  planCompleteDate: Dayjs | null;
  problemDescription: string | null;
  repairPrice: number | null;
  statusId: string | null;
  unit: string | null;
  urgencyId: string | null;
}
