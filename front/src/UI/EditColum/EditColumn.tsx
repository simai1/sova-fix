import { SettingOutlined } from '@ant-design/icons';
import { Button, Popover } from 'antd';
import { FC, useState } from 'react';

import styles from './styles.module.scss';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { onCheckState, resetAllColumns } from '../../store/editColumTable/editColumTable.slice.js';
import { TEditColumnState } from '../../types/store/editColumnSlice';

const EditColumn: FC = () => {
  const [openList, setOpenList] = useState<boolean>(false);
  const store = useAppSelector((state) => state.editColumTableSlice) as TEditColumnState;
  const dispatch = useAppDispatch();

  return (
    <Popover
      arrow={false}
      trigger="click"
      content={
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <input
              type="checkbox"
              checked={store.AllCheckbox}
              readOnly
              onClick={() => dispatch(resetAllColumns())}
            />
            <span>Все</span>
          </li>
          {store.ActiveColumTable.slice(3).map((el) => (
            <li className={styles.listItem} key={el.key}>
              <input
                type="checkbox"
                checked={el.isActive}
                readOnly
                onClick={() => dispatch(onCheckState({ key: el.key, isActive: el.isActive }))}
              />
              <span>{el.value}</span>
            </li>
          ))}
        </ul>
      }
    >
      <Button onClick={() => setOpenList(!openList)}>
        <SettingOutlined />
      </Button>
    </Popover>
  );
};

export default EditColumn;
