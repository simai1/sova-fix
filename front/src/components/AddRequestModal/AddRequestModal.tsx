import { Button, Flex, Form, Input, Modal, notification, Select, Typography, Upload } from 'antd';
import { useForm, useWatch } from 'antd/es/form/Form';
import { UploadFile } from 'antd/lib';
import { FC, useContext, useEffect, useMemo, useState } from 'react';

import { TAddRequestModalProps, TCreateRequestForm } from './types';
import {
  useCreateRequestSinglePhotoMutation,
  useCreateRequestWithMultyPhotoMutation,
  useCreateRequestWithoutPhotoMutation,
  useGetAllUnitsQuery,
  useLazyGetAllObjectsQuery,
} from '../../API/rtkQuery/requests.api';
import { FORM_RULES } from '../../constants/form.constants';
import { IS_PHOTO_REQUIRED } from '../../constants/settings.constants';
import DataContext from '../../context';
import { transformUrgencyListToOptions } from '../../utils/dataTrasformers';
import { getUrgencyById } from '../../utils/getId.util';

const { Text } = Typography;

const AddRequestModal: FC<TAddRequestModalProps> = ({ handleClose }) => {
  const { context } = useContext(DataContext);
  const { urgencyList, directoryCategories } = context;
  const [form] = useForm<TCreateRequestForm>();
  const userDataRaw = sessionStorage.getItem('userData');
  const userId = userDataRaw ? JSON.parse(userDataRaw)?.user?.id : null;
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const isPhotoRequired = useMemo(
    () => context.settingsList.find((s) => s.setting === IS_PHOTO_REQUIRED)?.value,
    [context.settingsList],
  );

  const unitId = useWatch('unitId', form);

  const { data: units, isLoading: isUnitsLoading } = useGetAllUnitsQuery();
  const [getAllObjectsMethod, { data: objects }] = useLazyGetAllObjectsQuery();
  const [createRequestWithMultyPhotoMethod, { isLoading: isRequestWithMultyPhotoLoading }] =
    useCreateRequestWithMultyPhotoMutation();
  const [createRequestSinglePhotoMethod, { isLoading: isRequestWithSinglePhotoLoading }] =
    useCreateRequestSinglePhotoMutation();
  const [createRequestWithoutPhotoMethod, { isLoading: isRequestWithoutPhotoLoading }] =
    useCreateRequestWithoutPhotoMutation();
  const [notificationApi, contextHolder] = notification.useNotification();

  const isOkButtonLoading =
    isRequestWithMultyPhotoLoading ||
    isRequestWithSinglePhotoLoading ||
    isRequestWithoutPhotoLoading;

  const urgencyTransformedOptions = useMemo(
    () => transformUrgencyListToOptions(urgencyList),
    [urgencyList],
  );

  useEffect(() => {
    if (units?.length === 1) {
      form.setFieldsValue({ unitId: units[0]?.id });
    }
  }, [units]);

  useEffect(() => {
    if (objects?.length === 1) {
      form.setFieldsValue({ objectId: objects[0]?.id });
    }
  }, [objects]);

  useEffect(() => {
    if (unitId && userId) {
      getAllObjectsMethod({ userId, unitId });
    }
  }, [userId, unitId]);

  const handleCloseModal = () => {
    handleClose();
    context.UpdateForse();
  };

  const handleCreateRequest = async () => {
    const values = await form.validateFields();
    const urgency = getUrgencyById(values.urgency, urgencyList)?.name;
    const isHasFiles = fileList.length > 0;

    if (!urgency) return;

    if (isPhotoRequired && !isHasFiles) {
      notificationApi.error({ message: 'Необходимо прекрепить фото' });
      return;
    }

    if (!isHasFiles) {
      await createRequestWithoutPhotoMethod({
        ...values,
        userId,
        urgency,
      });
      handleCloseModal();
      return;
    }

    const formData = new FormData();

    // обычные поля
    formData.append('objectId', values.objectId);
    formData.append('problemDescription', values.problemDescription);
    formData.append('urgency', urgency ?? '');

    if (values.directoryCategoryId) {
      formData.append('directoryCategoryId', values.directoryCategoryId);
    }

    // файлы
    fileList?.forEach((file: any) => {
      formData.append('file', file.originFileObj);
    });
    formData.append('userId', userId);

    if (fileList && fileList.length === 1) {
      await createRequestSinglePhotoMethod(formData);
      handleCloseModal();
      return;
    }

    await createRequestWithMultyPhotoMethod(formData);
    handleCloseModal();
  };

  return (
    <>
      {contextHolder}
      <Modal
        title="Создание заявки"
        open
        onCancel={handleClose}
        onOk={handleCreateRequest}
        okText="Создать"
        okButtonProps={{ loading: isOkButtonLoading }}
      >
        <Form form={form}>
          <Flex vertical gap={5}>
            <Text>Подразделение</Text>
            <Form.Item<TCreateRequestForm> name="unitId" rules={FORM_RULES}>
              <Select
                placeholder="Выберите подраздение"
                options={units ?? []}
                fieldNames={{ label: 'name', value: 'id' }}
                allowClear
                showSearch
              />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Объект</Text>
            <Form.Item<TCreateRequestForm> name="objectId" rules={FORM_RULES}>
              <Select
                placeholder="Выберите объект"
                disabled={!unitId}
                options={objects ?? []}
                loading={isUnitsLoading}
                fieldNames={{ label: 'name', value: 'id' }}
                allowClear
                showSearch
              />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Категория</Text>
            <Form.Item<TCreateRequestForm> name="directoryCategoryId" rules={FORM_RULES}>
              <Select
                options={directoryCategories ?? []}
                fieldNames={{ label: 'name', value: 'id' }}
                allowClear
                showSearch
                placeholder="Выберите категорию"
              />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Описание проблемы</Text>
            <Form.Item<TCreateRequestForm> name="problemDescription" rules={FORM_RULES}>
              <Input.TextArea placeholder="Введите описание проблемы" allowClear />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Срочность</Text>
            <Form.Item<TCreateRequestForm> name="urgency" rules={FORM_RULES}>
              <Select
                placeholder="Выберите срочность"
                allowClear
                showSearch
                options={urgencyTransformedOptions}
                optionFilterProp="labeText"
              />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Фотографии</Text>

            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => {
                const limitedList = fileList.slice(0, 5);
                setFileList(limitedList);
              }}
              maxCount={5}
              listType="picture"
            >
              {fileList.length < 5 && <Button variant="outlined">Загрузить</Button>}
            </Upload>
          </Flex>
        </Form>
      </Modal>
    </>
  );
};

export default AddRequestModal;
