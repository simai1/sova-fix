import { useForm } from 'antd/es/form/Form';
import { FC } from 'react';

import RequestEditModalComponent from './RequestEditModal.component';
import { IRepairEditForm, IRequestEditModalContainer } from './types';

const RequestEditModalContainer: FC<IRequestEditModalContainer> = ({ open, handleCloseModal }) => {
  const [form] = useForm<IRepairEditForm>();

  return <RequestEditModalComponent open={open} form={form} handleCloseModal={handleCloseModal} />;
};

export default RequestEditModalContainer;
