import { FC } from "react";
import styles from "./styles.module.scss";
import { ReportWorkZoneComponentsProps } from "./types";
import classNames from "classnames";
import AntLoader from "../../../../UI/Antd/AntLoader/AntLoader";
import { Empty } from "antd";
import ReportTable from "./ReportTable/ReportTable";

const ReportWorkZoneComponent: FC<ReportWorkZoneComponentsProps> = ({
    isEmptyReport,
    isLoadingTableData,
}) => {
    const isCenter = isEmptyReport || isLoadingTableData;

    return (
        <div className={classNames(styles.container, { [styles.center as string]: isCenter })}>
            {isLoadingTableData && <AntLoader isLoading />}

            {!isLoadingTableData && (
                isEmptyReport ? (
                    <Empty description="Отчёт пуст" />
                ) : (
                    <div className={styles.tableWrapper}>
                        <ReportTable />
                    </div>
                )
            )}
        </div>
    );
};

export default ReportWorkZoneComponent;
