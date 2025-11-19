import { FC } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { ChartComponentProps } from "./types";
import CustomTooltip from "./CustomTooltip/CustomTooltip";
import { Empty, Flex } from "antd";
import styles from "./styles.module.scss";

const ChartComponent: FC<ChartComponentProps> = ({
    chartReportData,
    isEmptyChart,
}) => {
    return (
        <>
            {isEmptyChart ? (
                <Flex className={styles.empty} align="center" justify="center">
                    <Empty description="Выберите параметр и показатель" />
                </Flex>
            ) : (
                <div className={styles["chart-container"]}>
                    <ResponsiveContainer>
                        <LineChart
                            data={chartReportData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10 }}
                                angle={-45}
                                interval={0}
                                textAnchor="end"
                            />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#d8cdc1ff"
                                strokeWidth={4}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </>
    );
};

export default ChartComponent;
