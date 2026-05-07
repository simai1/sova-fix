import { Modal, Select, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  useGetAllObjectsQuery,
  useGetUserObjectsQuery,
  useSetUserObjectsMutation,
} from '@/API/rtkQuery/userObjects.api';
import { showToast } from '@/components/Lk/toastBus';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = {
  open: boolean;
  userId: string | null;
  userName?: string | null;
  onClose: () => void;
};

type OptionGroup = {
  label: string;
  options: { label: string; value: string }[];
};

const UserObjectsAssign = ({ open, userId, userName, onClose }: Props): JSX.Element => {
  const { data: allObjects = [], isLoading: objLoading } = useGetAllObjectsQuery(undefined, {
    skip: !open,
  });
  const { data: userObjects, isLoading: prefillLoading } = useGetUserObjectsQuery(userId ?? '', {
    skip: !open || !userId,
  });
  const [setUserObjects, { isLoading: saving }] = useSetUserObjectsMutation();

  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && userObjects) {
      setSelected(userObjects);
    }
    if (!open) {
      setSelected([]);
    }
  }, [open, userObjects]);

  const grouped = useMemo<OptionGroup[]>(() => {
    const map = new Map<string, OptionGroup>();
    allObjects.forEach((o) => {
      const key = o.unit?.id ?? '__nounit';
      const label = o.unit?.name ?? 'Без бизнес-юнита';
      if (!map.has(key)) map.set(key, { label, options: [] });
      map.get(key)!.options.push({ label: o.name, value: o.id });
    });
    return Array.from(map.values());
  }, [allObjects]);

  const handleSave = async (): Promise<void> => {
    if (!userId) return;
    try {
      await setUserObjects({ userId, objectIds: selected }).unwrap();
      showToast('success', 'Объекты назначены');
      onClose();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      title={`Назначение объектов${userName ? ` — ${userName}` : ''}`}
      onCancel={onClose}
      onOk={handleSave}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={saving}
      destroyOnClose
    >
      {objLoading || prefillLoading ? (
        <Spin />
      ) : (
        <Select
          mode="multiple"
          allowClear
          showSearch
          style={{ width: '100%' }}
          placeholder="Выберите объекты"
          value={selected}
          onChange={setSelected}
          options={grouped}
          optionFilterProp="label"
          maxTagCount="responsive"
        />
      )}
    </Modal>
  );
};

export default UserObjectsAssign;
