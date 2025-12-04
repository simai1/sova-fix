import { IndicatorsFormInstance } from '../../types';
import { GraphicItem } from '../Chart/types';

export type BarChartComponentProps = {
  barChartReportData: GraphicItem[];
  isEmptyChart: boolean;
  selectedIndicator: keyof IndicatorsFormInstance | null;
};
