import { Empty, Flex, Typography } from 'antd';
import { FC } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

import styles from './styles.module.scss';
import { BarChartComponentProps } from './types';
import { INDICATOR_LOCALE } from '../../constants';
import { PIE_COLORS } from '../Pie/contants';

const BarChartComponent: FC<BarChartComponentProps> = ({
  barChartReportData,
  isEmptyChart,
  selectedIndicator,
}) => {
  return (
    <>
      {isEmptyChart ? (
        <Flex className={styles.empty} align="center" justify="center">
          <Empty
            description={
              <Typography.Title level={4}>
                Выберите 1 параметр и 1 показатель для отображения диаграммы
              </Typography.Title>
            }
          />
        </Flex>
      ) : (
        <div className={styles['chart-wrapper']}>
          <div className={styles['chart-container']}>
            <ResponsiveContainer className={styles.chart}>
              <BarChart
                data={barChartReportData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 40,
                  bottom: 100,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  interval={0}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    value,
                    selectedIndicator ? INDICATOR_LOCALE[selectedIndicator] : 'Значение',
                  ]}
                  contentStyle={{
                    background: '#fff',
                    borderRadius: 8,
                    border: '1px solid #eee',
                  }}
                />
                <Bar dataKey="value">
                  {barChartReportData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      style={{
                        transition: 'opacity 0.3s ease',
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default BarChartComponent;
