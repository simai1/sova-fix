import { Empty, Typography } from 'antd';
import classNames from 'classnames';
import { FC } from 'react';
import styles from './styles.module.scss';
import { ReportWorkZoneComponentsProps } from './types';
import { useAppSelector } from '../../../../hooks/store';
import AntLoader from '../../../../UI/Antd/AntLoader/AntLoader';
import { REPORT_TYPE_TEXT } from '../constants';
import { reportTypeSelector } from '../selectors';
import { reportWorkZoneType } from './utils';

const ReportWorkZoneComponent: FC<ReportWorkZoneComponentsProps> = ({
  isEmptyReport,
  isLoadingTableData,
}) => {
  const isCenter = isEmptyReport || isLoadingTableData;
  const reportType = useAppSelector(reportTypeSelector);

  return (
    <div
      className={classNames(styles.container, {
        [styles.center as string]: isCenter,
      })}
    >
      {isLoadingTableData && <AntLoader />}

      {!isLoadingTableData &&
        (isEmptyReport ? (
          <Empty
            description={
              reportType === 'table' ? (
                'Отчёт пуст'
              ) : (
                <Typography.Title level={4}>
                  Выберите 1 параметр и 1 показатель для отображения {REPORT_TYPE_TEXT[reportType]}
                </Typography.Title>
              )
            }
          />
        ) : (
          <div className={styles.tableWrapper}>{reportWorkZoneType[reportType]}</div>
        ))}
    </div>
  );
};

export default ReportWorkZoneComponent;
