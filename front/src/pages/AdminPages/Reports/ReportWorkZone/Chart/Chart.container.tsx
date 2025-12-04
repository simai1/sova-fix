import { useAppSelector } from "../../../../../hooks/store";
import {
    selectedIndicatorSelector,
    selectedParameterSelector,
    tableReportDataSelector,
} from "../../selectors";
import ChartComponent from "./Chart.component";
import { useGraphicData } from "../../hooks";

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
