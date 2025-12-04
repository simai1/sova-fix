import { IndicatorsFormInstance } from "../../../types";

export interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
    selectedIndicator: keyof IndicatorsFormInstance | null
}
