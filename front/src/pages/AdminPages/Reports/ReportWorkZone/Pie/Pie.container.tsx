import { useAppSelector } from "../../../../../hooks/store";
import {
    selectedIndicatorSelector,
    selectedParameterSelector,
    tableReportDataSelector,
} from "../../selectors";
import PieComponent from "./Pie.component";
import { useGraphicData } from "../../hooks";

const PieContainer = () => {
    const tableReportData = useAppSelector(tableReportDataSelector);
    const selectedParameter = useAppSelector(selectedParameterSelector);
    const selectedIndicator = useAppSelector(selectedIndicatorSelector);

    const { graphicData: pieReportData, isEmptyChart } = useGraphicData({
        tableData: tableReportData,
        selectedParameter,
        selectedIndicator,
    });


    return <PieComponent pieReportData={pieReportData} isEmptyChart={isEmptyChart} />;
};

export default PieContainer;
