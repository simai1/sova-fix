import { ReactNode } from 'react';

import { ReportType } from '../types';
import BarChartContainer from './BarChart/BarChart.container';
import ChartContainer from './Chart/Chart.container';
import PieContainer from './Pie/Pie.container';
import ReportTable from './ReportTable/ReportTable';

export const reportWorkZoneType: Record<ReportType, ReactNode> = {
  table: <ReportTable />,
  chart: <ChartContainer />,
  pie: <PieContainer />,
  barChart: <BarChartContainer />,
};
