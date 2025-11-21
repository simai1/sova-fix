import { FC, useState } from "react";
import {
    PieChart,
    Pie,
    Tooltip,
    Cell,
    ResponsiveContainer,
} from "recharts";
import { Empty, Flex, Typography } from "antd";
import styles from "./styles.module.scss";
import { PieComponentProps } from "./types";
import { PIE_COLORS } from "./contants";

const PieComponent: FC<PieComponentProps> = ({
    pieReportData,
    isEmptyChart,
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    return (
        <>
            {isEmptyChart ? (
                <Flex className={styles.empty} align="center" justify="center">
                    <Empty
                        description={
                            <Typography.Title level={4}>
                                Выберите 1 параметр и 1 показатель для отображения диаграммы
                            </Typography.Title>
                        }
                    />
                </Flex>
            ) : (
                <div className={styles["chart-wrapper"]}>
                    <div className={styles["chart-container"]}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieReportData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={170}
                                    isAnimationActive={true}
                                    animationDuration={400}
                                    paddingAngle={1}
                                    cornerRadius={3}
                                    onMouseEnter={onPieEnter}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    labelLine={false}
                                >
                                    {pieReportData.map((_, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={PIE_COLORS[idx]}
                                            opacity={
                                                activeIndex === null ||
                                                activeIndex === idx
                                                    ? 1
                                                    : 0.4
                                            }
                                            stroke="#fff"
                                            strokeWidth={1}
                                            style={{
                                                transition: "opacity 0.3s ease",
                                            }}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value: number, name: string) => [
                                        value,
                                        name,
                                    ]}
                                    contentStyle={{
                                        background: "#fff",
                                        borderRadius: 8,
                                        border: "1px solid #eee",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={styles.legend}>
                        {pieReportData.map((item, idx) => (
                            <div
                                key={idx}
                                className={`${styles.legendItem} ${
                                    activeIndex === idx
                                        ? styles.activeLegend
                                        : ""
                                }`}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                <span
                                    className={styles.legendDot}
                                    style={{ backgroundColor: PIE_COLORS[idx] }}
                                />
                                <span className={styles.legendText}>
                                    {item.name} — {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default PieComponent;
