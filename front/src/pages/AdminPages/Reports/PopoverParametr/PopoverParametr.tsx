import { Checkbox, ConfigProvider, Typography } from 'antd';
import { FC, useMemo } from 'react';

import { PopoverParametrProps } from './types';
import { findParametr } from './utils';
import { useAppSelector } from '../../../../hooks/store';
import { filterDataSelector, filterDataValuesSelector } from '../selectors';
import styles from './styles.module.scss';

const PopoverParametr: FC<PopoverParametrProps> = ({ parametr, handleSetFilterDataValues }) => {
  const filterData = useAppSelector(filterDataSelector);
  const filterDataValues = useAppSelector(filterDataValuesSelector);

  const checkBoxes = useMemo(() => {
    if (filterData) {
      return findParametr(parametr, filterData);
    }
    return [];
  }, [filterData, parametr]);

  const selectedValues = useMemo(() => {
    if (filterDataValues === null || !(parametr in (filterDataValues ?? {}))) {
      return checkBoxes.map((cb) => cb.value);
    }

    const values = filterDataValues[parametr as keyof typeof filterDataValues];
    return Array.isArray(values) ? values : [];
  }, [filterDataValues, checkBoxes, parametr]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ffe20d',
        },
      }}
    >
      <div className={styles.container}>
        {checkBoxes?.length > 0 ? (
          <Checkbox.Group
            className={styles.checkBoxes}
            options={checkBoxes}
            value={selectedValues}
            onChange={(vals) => handleSetFilterDataValues(parametr, vals)}
          />
        ) : (
          <Typography.Paragraph className={styles.text}>
            Для фильтрации отметьте данный параметр
          </Typography.Paragraph>
        )}
      </div>
    </ConfigProvider>
  );
};

export default PopoverParametr;
