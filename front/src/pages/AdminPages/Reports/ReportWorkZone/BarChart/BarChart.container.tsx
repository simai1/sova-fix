import BarChartComponent from './BarChart.component';
import { useAppSelector } from '../../../../../hooks/store';
import { useGraphicData } from '../../hooks';
import {
  selectedIndicatorSelector,
  selectedParameterSelector,
  tableReportDataSelector,
} from '../../selectors';

const BarChartContainer = () => {
  const tableReportData = useAppSelector(tableReportDataSelector);
  const selectedParameter = useAppSelector(selectedParameterSelector);
  const selectedIndicator = useAppSelector(selectedIndicatorSelector);

  const { graphicData: barChartReportData, isEmptyChart } = useGraphicData({
    tableData: tableReportData,
    selectedParameter,
    selectedIndicator,
  });

  return (
    <BarChartComponent
      barChartReportData={barChartReportData}
      isEmptyChart={isEmptyChart}
      selectedIndicator={selectedIndicator}
    />
  );
};

export default BarChartContainer;
