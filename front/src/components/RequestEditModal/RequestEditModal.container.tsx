import { notification } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { RcFile } from 'antd/es/upload';
import dayjs from 'dayjs';
import { FC, useContext, useEffect, useMemo, useState } from 'react';

import RequestEditModalComponent from './RequestEditModal.component';
import { IRepairEditForm, IRequestEditModalContainer } from './types';
import {
  useAttachMediaMutation,
  useGetAllObjectsQuery,
  useLazyGetOneRequestQuery,
  useUpdateRequestMutation,
} from '../../API/rtkQuery/requests.api';
import { IUpdateRequestPayload } from '../../API/rtkQuery/types/requests.types';
import { MAX_SIZE_FILE } from '../../constants/sizes.contants';
import DataContext from '../../context';
import {
  normalizeFileNames,
  transformDataContractorsToOptions,
  transformObjectsToOptions,
  transformStatusListToOptions,
  transformUrgencyListToOptions,
} from '../../utils/dataTrasformers';
import {
  getStatusById,
  getStatusByName,
  getUrgencyById,
  getUrgencyByName,
} from '../../utils/getId.util';

const RequestEditModalContainer: FC<IRequestEditModalContainer> = ({ open, handleCloseModal }) => {
  const { context } = useContext(DataContext);
  const { statusList, urgencyList, dataContractors, selectedTr, UpdateTableReguest } = context;
  const [api, contextHolder] = notification.useNotification();
  const [parsedFiles, setParsedFiles] = useState<string[]>([]);
  const [isSliderOpen, setIsSliderOpen] = useState<boolean>(false);
  const [form] = useForm<IRepairEditForm>();
  const isUploadDisabled = parsedFiles.length === 5;
  const userDataRaw = sessionStorage.getItem('userData');
  const userId = userDataRaw ? JSON.parse(userDataRaw)?.user?.id : null;

  const { data: objects, isLoading: isObjectsLoading } = useGetAllObjectsQuery({
    userId,
  });
  const [getOneRequest, { data: requestData, isLoading: isRequestDataLoading }] =
    useLazyGetOneRequestQuery();
  const [attachMedia] = useAttachMediaMutation();
  const [updateRequest, { isLoading: isUpdatingRequest }] = useUpdateRequestMutation();

  const statusOptions = useMemo(() => transformStatusListToOptions(statusList), [statusList]);
  const urgencyOptions = useMemo(() => transformUrgencyListToOptions(urgencyList), [urgencyList]);
  const contractorOptions = useMemo(
    () => transformDataContractorsToOptions(dataContractors),
    [dataContractors],
  );
  const objectOptions = useMemo(() => transformObjectsToOptions(objects ?? []), [objects]);

  const beforeUploadFile = async (file: RcFile) => {
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > MAX_SIZE_FILE) {
      api.error({ message: `Файл превышает максимальный размер (${MAX_SIZE_FILE})` });
      return;
    }

    const formData = new FormData();
    formData.append('requestId', selectedTr);
    formData.append('file', file);
    const { data } = await attachMedia(formData);
    if (data && data.fileName) {
      form.setFieldValue('fileName', data.fileName);
      const parsedFileNames = normalizeFileNames(data.fileName);
      setParsedFiles(parsedFileNames);
    }
    UpdateTableReguest();
    return false;
  };

  useEffect(() => {
    if (selectedTr) {
      getOneRequest({ requestId: selectedTr });
    }
  }, [selectedTr, open]);

  useEffect(() => {
    if (requestData) {
      form.setFieldsValue({
        builder: requestData.builder,
        contractor: requestData.contractor ? requestData.contractor.id : null,
        comment: requestData.comment,
        objectId: requestData.objectId,
        planCompleteDate: requestData.planCompleteDateRaw
          ? dayjs(requestData.planCompleteDateRaw)
          : null,
        problemDescription: requestData.problemDescription,
        repairPrice: requestData.repairPrice,
        fileName: requestData.fileName,
        statusId: getStatusByName(requestData.status, statusList)?.id,
        urgencyId: getUrgencyByName(requestData.urgency, urgencyList)?.id,
      });

      if (requestData.fileName) {
        const parsedFileNames = normalizeFileNames(requestData.fileName);
        setParsedFiles(parsedFileNames);
      }
    }
  }, [requestData]);

  const handleOpenSlider = () => {
    setIsSliderOpen(true);
  };

  const handleCloseSlider = () => {
    setIsSliderOpen(false);
  };

  const handleSaveRequest = async () => {
    if (selectedTr) {
      const values = form.getFieldsValue();
      const newPlanCompleteDate = values.planCompleteDate
        ? dayjs(values.planCompleteDate).utcOffset(0, true).format()
        : null;

      const payload: IUpdateRequestPayload = {
        planCompleteDate: newPlanCompleteDate,
        requestId: selectedTr,
        urgency: values.urgencyId ? getUrgencyById(values.urgencyId, urgencyList)?.name : undefined,
        status: values.statusId ? getStatusById(values.statusId, statusList)?.number : undefined,
        problemDescription: values.problemDescription ?? undefined,
        repairPrice: values.repairPrice ?? undefined,
        comment: values.comment ?? undefined,
        builder: values.builder ?? undefined,
        contractorId: values.contractor ?? undefined,
        objectId: values.objectId ?? undefined,
      };

      await updateRequest(payload);
      UpdateTableReguest();
      handleCloseModal();
    }
  };

  return (
    <>
      {contextHolder}
      <RequestEditModalComponent
        open={open}
        form={form}
        statusOptions={statusOptions}
        urgencyOptions={urgencyOptions}
        contractorOptions={contractorOptions}
        objectOptions={objectOptions}
        isObjectsLoading={isObjectsLoading}
        isRequestDataLoading={isRequestDataLoading}
        parsedFiles={parsedFiles}
        isUploadDisabled={isUploadDisabled}
        isSliderOpen={isSliderOpen}
        isUpdatingRequest={isUpdatingRequest}
        handleCloseModal={handleCloseModal}
        beforeUploadFile={beforeUploadFile}
        handleOpenSlider={handleOpenSlider}
        handleCloseSlider={handleCloseSlider}
        handleSaveRequest={handleSaveRequest}
      />
    </>
  );
};

export default RequestEditModalContainer;
