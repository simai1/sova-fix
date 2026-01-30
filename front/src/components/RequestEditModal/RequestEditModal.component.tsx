import {
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

const { Text } = Typography;

const RequestEditModalComponent: FC<IRequestEditModalComponent> = ({
  open,
  form,
  handleCloseModal,
}) => {
  return (
    <Modal
      className={styles.modal}
      open={open}
      onCancel={handleCloseModal}
      title="Редактирование заявки"
      width={700}
      okText="Сохранить"
      cancelText="Закрыть"
    >
      <div className={styles.container}>
        <Form className={styles.form} form={form}>
          <Flex vertical gap={5}>
            <Text>Исполнитель</Text>
            <Form.Item<IRepairEditForm> name="contractor">
              <Select placeholder="Выберите исполнителя" />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Срочность</Text>
            <Form.Item<IRepairEditForm> name="urgencyId">
              <Select placeholder="Выберите срочность" />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Статус заявки</Text>
            <Form.Item<IRepairEditForm> name="statusId">
              <Select placeholder="Выберите статус" />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Объект</Text>
            <Form.Item<IRepairEditForm> name="objectId">
              <Select placeholder="Выберите объект" />
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
              <DatePicker style={{ width: '100%' }} placeholder="дд.мм.гггг" />
            </Form.Item>
          </Flex>
          <Flex vertical gap={10}>
            <Flex gap={10}>
              <Flex gap={5}>ФОТКА</Flex>
              <Flex className={styles.comment} vertical gap={5}>
                <Text>Комментарий</Text>
                <Form.Item<IRepairEditForm> name="comment">
                  <Input.TextArea placeholder="Введите комментарий" />
                </Form.Item>
              </Flex>
            </Flex>
            <Upload />
          </Flex>
          <Flex vertical gap={5}>
            <Text>Описание проблемы</Text>
            <Form.Item<IRepairEditForm> name="problemDescription">
              <Input.TextArea placeholder="Введите описание проблемы" />
            </Form.Item>
          </Flex>
          <Flex vertical gap={5}>
            <Text>Бюджет ремонта (Рублей)</Text>
            <Form.Item<IRepairEditForm> name="repairPrice">
              <InputNumber style={{ width: '100%', padding: 5 }} placeholder="3000" min={0} />
            </Form.Item>
          </Flex>
        </Form>
      </div>
    </Modal>
  );
};

export default RequestEditModalComponent;
