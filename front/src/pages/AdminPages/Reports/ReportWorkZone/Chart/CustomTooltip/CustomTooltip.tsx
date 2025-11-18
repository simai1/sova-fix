import { FC } from "react";
import { CustomTooltipProps } from "./types";
import styles from './styles.module.scss'

const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className={styles.tooltipContainer}>
                <p className={styles.label}><strong>{label}</strong></p>
                <p className={styles.value}>Значение: {payload[0]?.value}</p>
            </div>
        );
    }
    return null;
};

export default CustomTooltip;
