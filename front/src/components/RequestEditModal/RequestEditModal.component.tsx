import { UploadOutlined } from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Typography,
  Upload,
} from 'antd';
import { FC } from 'react';

import styles from './styles.module.scss';
import { IRepairEditForm, IRequestEditModalComponent } from './types';
import { API_URL } from '../../constants/env.constant';
import PhotoAndVideoSlider from '../../UI/PhotoAndVideoSlider/PhotoAndVideoSlider.jsx';

const { Text } = Typography;

const RequestEditModalComponent: FC<IRequestEditModalComponent> = ({
  open,
  form,
  statusOptions,
  urgencyOptions,
  contractorOptions,
  objectOptions,
  isObjectsLoading,
  isRequestDataLoading,
  parsedFiles,
  isUploadDisabled,
  isSliderOpen,
  isUpdatingRequest,
  handleCloseModal,
  beforeUploadFile,
  handleCloseSlider,
  handleOpenSlider,
  handleSaveRequest,
}) => {
  return (
    <Modal
      className={styles.modal}
      open={open}
      onCancel={handleCloseModal}
      title="Редактирование заявки"
      width={1000}
      okText="Сохранить"
      cancelText="Закрыть"
      loading={isRequestDataLoading}
      okButtonProps={{ loading: isUpdatingRequest }}
      onOk={handleSaveRequest}
    >
      <div className={styles.container}>
        <Form className={styles.form} form={form}>
          <Flex vertical gap={10}>
            <Flex vertical gap={5}>
              <Text>Исполнитель</Text>
              <Form.Item<IRepairEditForm> name="contractor">
                <Select
                  placeholder="Выберите исполнителя"
                  options={contractorOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Flex>
            <Flex vertical gap={5}>
              <Text>Срочность</Text>
              <Form.Item<IRepairEditForm> name="urgencyId">
                <Select
                  placeholder="Выберите срочность"
                  options={urgencyOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Flex>
            <Flex vertical gap={5}>
              <Text>Статус заявки</Text>
              <Form.Item<IRepairEditForm> name="statusId">
                <Select
                  placeholder="Выберите статус"
                  options={statusOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Flex>
            <Flex vertical gap={5}>
              <Text>Объект</Text>
              <Form.Item<IRepairEditForm> name="objectId">
                <Select
                  placeholder="Выберите объект"
                  options={objectOptions}
                  loading={isObjectsLoading}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Flex>
            <Flex vertical gap={5}>
              <Text>Подрядчика</Text>
              <Form.Item<IRepairEditForm> name="builder">
                <Input className={styles.input} placeholder="Введите подрядчика" />
              </Form.Item>
            </Flex>
            <Flex vertical gap={5}>
              <Text>Плановая дата выполнения</Text>
              <Form.Item<IRepairEditForm> name="planCompleteDate">
                <DatePicker
                  style={{ width: '100%' }}
                  format={'DD.MM.YYYY'}
                  placeholder="дд.мм.гггг"
                />
              </Form.Item>
            </Flex>
          </Flex>

          <Flex vertical gap={10}>
            <Flex vertical gap={10}>
              <Flex align="start" gap={10}>
                <div className={styles.imgContainer}>
                  {parsedFiles.length !== 0 ? (
                    <div className={styles.img}>
                      <img
                        onClick={handleOpenSlider}
                        src={`${API_URL}/uploads/${parsedFiles[parsedFiles.length - 1]}`}
                      />
                    </div>
                  ) : (
                    <div className={styles.placeholder}>Нет файла</div>
                  )}
                </div>

                <Flex className={styles.comment} vertical gap={5}>
                  <Text>Комментарий</Text>
                  <Form.Item<IRepairEditForm> name="comment">
                    <Input.TextArea className={styles.textArea} placeholder="Введите комментарий" />
                  </Form.Item>
                </Flex>
              </Flex>
              <Upload
                beforeUpload={beforeUploadFile}
                disabled={isUploadDisabled}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Добавить медиа</Button>
              </Upload>
            </Flex>
            <Flex vertical gap={5}>
              <Text>Описание проблемы</Text>
              <Form.Item<IRepairEditForm> name="problemDescription">
                <Input.TextArea
                  className={styles.textArea}
                  placeholder="Введите описание проблемы"
                />
              </Form.Item>
            </Flex>
            <Flex vertical gap={5}>
              <Text>Бюджет ремонта (Рублей)</Text>
              <Form.Item<IRepairEditForm> name="repairPrice">
                <InputNumber style={{ width: '100%', padding: 5 }} placeholder="3000" min={0} />
              </Form.Item>
            </Flex>
          </Flex>
        </Form>
      </div>

      {isSliderOpen && (
        <PhotoAndVideoSlider
          sliderPhotos={parsedFiles}
          initialIndex={parsedFiles.length - 1}
          closeSlider={handleCloseSlider}
        />
      )}
    </Modal>
  );
};

export default RequestEditModalComponent;
