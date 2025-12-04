import ChartComponent from './Chart.component';
import { useAppSelector } from '../../../../../hooks/store';
import { useGraphicData } from '../../hooks';
import {
  selectedIndicatorSelector,
  selectedParameterSelector,
  tableReportDataSelector,
} from '../../selectors';

const ChartContainer = () => {
  const tableReportData = useAppSelector(tableReportDataSelector);
  const selectedParameter = useAppSelector(selectedParameterSelector);
  const selectedIndicator = useAppSelector(selectedIndicatorSelector);

  const { graphicData: chartReportData, isEmptyChart } = useGraphicData({
    tableData: tableReportData,
    selectedParameter,
    selectedIndicator,
  });

  return (
    <ChartComponent
      chartReportData={chartReportData}
      isEmptyChart={isEmptyChart}
      selectedIndicator={selectedIndicator}
    />
  );
};

export default ChartContainer;
