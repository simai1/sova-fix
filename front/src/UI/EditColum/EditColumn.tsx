import { SettingOutlined } from '@ant-design/icons';
import { Button, Popover, Tooltip } from 'antd';
import { FC, useState } from 'react';

import styles from './styles.module.scss';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { onCheckState, resetAllColumns } from '../../store/editColumTable/editColumTable.slice.js';
import { TEditColumnState } from '../../types/store/editColumnSlice';

const EditColumn: FC = () => {
  const [openList, setOpenList] = useState<boolean>(false);
  const store = useAppSelector((state) => state.editColumTableSlice) as TEditColumnState;
  const dispatch = useAppDispatch();

  const handleCheckAll = () => {
    dispatch(resetAllColumns());
  };

  const handleCheckColumn = (key: string, isActive?: boolean) => {
    dispatch(onCheckState({ key, isActive }));
  };

  return (
    <Popover
      arrow={false}
      trigger="click"
      content={
        <ul className={styles.list}>
          <li className={styles.listItem} onClick={handleCheckAll}>
            <input type="checkbox" checked={store.AllCheckbox} readOnly />
            <span>Все</span>
          </li>
          {store.ActiveColumTable.slice(3).map((el) => (
            <li
              className={styles.listItem}
              key={el.key}
              onClick={() => handleCheckColumn(el.key, el.isActive)}
            >
              <input type="checkbox" checked={el.isActive} readOnly />
              <span>{el.value}</span>
            </li>
          ))}
        </ul>
      }
    >
      <Tooltip title="Видимость колонок">
        <Button onClick={() => setOpenList(!openList)}>
          <SettingOutlined />
        </Button>
      </Tooltip>
    </Popover>
  );
};

export default EditColumn;
