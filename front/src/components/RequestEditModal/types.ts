import { FormInstance } from 'antd';
import { DefaultOptionType } from 'antd/es/select';
import { RcFile } from 'antd/es/upload';
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
  statusOptions: DefaultOptionType[];
  urgencyOptions: DefaultOptionType[];
  contractorOptions: DefaultOptionType[];
  objectOptions: DefaultOptionType[];
  isObjectsLoading: boolean;
  isRequestDataLoading: boolean;
  parsedFiles: string[];
  isUploadDisabled: boolean;
  isSliderOpen: boolean;
  isUpdatingRequest: boolean;
  beforeUploadFile: (file: RcFile) => void;
  handleOpenSlider: () => void;
  handleCloseSlider: () => void;
  handleSaveRequest: () => Promise<void>;
}

export interface IRepairEditForm {
  builder: string | null;
  contractor: string | null;
  comment: string | null;
  fileName: string | null;
  objectId: string;
  planCompleteDate: Dayjs | null;
  problemDescription: string | null;
  repairPrice: number | null;
  statusId: string | null;
  urgencyId: string | null;
}
