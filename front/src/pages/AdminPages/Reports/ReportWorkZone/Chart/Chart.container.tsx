import { useMemo } from "react";
import { useAppSelector } from "../../../../../hooks/store";
import {
    selectedIndicatorSelector,
    selectedParameterSelector,
    tableReportDataSelector,
} from "../../selectors";
import ChartComponent from "./Chart.component";
import { ChartItem } from "./types";

const ChartContainer = () => {
    const tableReportData = useAppSelector(tableReportDataSelector);
    const selectedParameter = useAppSelector(selectedParameterSelector);
    const selectedIndicator = useAppSelector(selectedIndicatorSelector);

    const isEmptyChart = !selectedParameter || !selectedIndicator

    const chartReportData: ChartItem[] = useMemo(() => {
        if (isEmptyChart) return [];
    
        return tableReportData
            .map((item) => {
                const name = item[selectedParameter as keyof typeof item];
                const value = item[selectedIndicator as keyof typeof item];
                if (typeof name !== "string" || typeof value !== "number")
                    return null;
    
                return { name, value };
            })
            .filter((item): item is ChartItem => item !== null);
    }, [tableReportData, selectedParameter, selectedIndicator]);
    

    return <ChartComponent chartReportData={chartReportData} isEmptyChart={isEmptyChart} />;
};

export default ChartContainer;
