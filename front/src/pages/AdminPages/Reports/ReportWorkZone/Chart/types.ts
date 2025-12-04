import { IndicatorsFormInstance } from '../../types';

export type ChartComponentProps = {
  chartReportData: GraphicItem[];
  isEmptyChart: boolean;
  selectedIndicator: keyof IndicatorsFormInstance | null;
};

export type GraphicItem = {
  name: string;
  value: number;
};
