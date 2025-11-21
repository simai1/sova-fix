import { FC } from "react";
import { CustomTooltipProps } from "./types";
import styles from "./styles.module.scss";
import { INDICATOR_LOCALE } from "../../../constants";

const CustomTooltip: FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
    selectedIndicator,
}) => {
    if (active && payload && payload.length) {
        return (
            <div className={styles.tooltipContainer}>
                <p className={styles.label}>
                    <strong>{label}</strong>
                </p>
                <p className={styles.value}>
                    {selectedIndicator
                        ? INDICATOR_LOCALE[selectedIndicator]
                        : "Значение"}
                    : {payload[0]?.value}
                </p>
            </div>
        );
    }
    return null;
};

export default CustomTooltip;
