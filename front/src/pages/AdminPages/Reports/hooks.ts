import { useMemo } from "react";
import { UseGraphicDataProps } from "./types";
import { GraphicItem } from "./ReportWorkZone/Chart/types";

export const useGraphicData = <T extends Record<string, any>>({
    tableData,
    selectedParameter,
    selectedIndicator,
}: UseGraphicDataProps<T>) => {

    const isEmptyChart = !selectedParameter || !selectedIndicator;

    const graphicData: GraphicItem[] = useMemo(() => {
        if (isEmptyChart) return [];

        return tableData
            .map((item) => {
                const rawName = item[selectedParameter!];
                const rawValue = item[selectedIndicator!];

                if (typeof rawName !== "string" || typeof rawValue !== "number") {
                    return null;
                }

                const result: GraphicItem = {
                    name: rawName,
                    value: rawValue,
                };

                return result;
            })
            .filter((item): item is GraphicItem => item !== null);
    }, [tableData, selectedParameter, selectedIndicator, isEmptyChart]);

    return { graphicData, isEmptyChart };
};
