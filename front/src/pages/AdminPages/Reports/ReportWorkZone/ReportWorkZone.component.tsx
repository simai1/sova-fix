import { FC } from "react";
import styles from "./styles.module.scss";
import { ReportWorkZoneComponentsProps } from "./types";
import classNames from "classnames";
import AntLoader from "../../../../UI/Antd/AntLoader/AntLoader";
import { Empty } from "antd";
import ReportTable from "./ReportTable/ReportTable";
import { useAppSelector } from "../../../../hooks/store";
import { reportTypeSelector } from "../selectors";
import { reportWorkZoneType } from "./utils";

const ReportWorkZoneComponent: FC<ReportWorkZoneComponentsProps> = ({
    isEmptyReport,
    isLoadingTableData,
}) => {
    const isCenter = isEmptyReport || isLoadingTableData;
    const reportType = useAppSelector(reportTypeSelector);

    return (
        <div
            className={classNames(styles.container, {
                [styles.center as string]: isCenter,
            })}
        >
            {isLoadingTableData && <AntLoader isLoading />}

            {!isLoadingTableData &&
                (isEmptyReport ? (
                    <Empty description="Отчёт пуст" />
                ) : (
                    <div className={styles.tableWrapper}>
                        {reportWorkZoneType[reportType]}
                    </div>
                ))}
        </div>
    );
};

export default ReportWorkZoneComponent;
