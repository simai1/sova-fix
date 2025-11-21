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
import { Empty, Flex, Typography } from "antd";
import styles from "./styles.module.scss";

const ChartComponent: FC<ChartComponentProps> = ({
    chartReportData,
    isEmptyChart,
    selectedIndicator,
}) => {
    return (
        <>
            {isEmptyChart ? (
                <Flex className={styles.empty} align="center" justify="center">
                    <Empty
                        description={
                            <Typography.Title level={4}>
                                Выберите 1 параметр и 1 показатель для отображения графика
                            </Typography.Title>
                        }
                    />
                </Flex>
            ) : (
                <div className={styles["chart-container"]}>
                    <ResponsiveContainer>
                        <LineChart
                            data={chartReportData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 40,
                                bottom: 100,
                            }}
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
                            <Tooltip content={<CustomTooltip selectedIndicator={selectedIndicator} />} />
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
