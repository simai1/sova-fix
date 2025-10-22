import { FC } from "react";
import styles from "./styles.module.scss";
import { Flex, Form, List } from "antd";
import Header from "../../../components/Header/Header.jsx";
import { INDICATOR_LIST, PARAMETRS_LIST } from "./constants";
import ReportListElement from "./ReportListElement/ReportListElement";
import { ReportsComponentProps } from "./types";
import ReportWorkZoneComponent from "./ReportWorkZone/ReportWorkZone.component";
import AdditionalParametrs from "./AdditionalParametrs/AdditionalParametrs";

const ReportsComponent: FC<ReportsComponentProps> = ({
    parametrsForm,
    indicatorsForm,
    isEmptyReport,
    isLoadingTableData,
    isDisabledIndicators,
    handleReloadTableData,
    handleResetFilters,
}) => {
    return (
        <Flex className={styles.container} vertical align="center">
            <Header />
            <Flex gap={5} className={styles.content} vertical align="center">
                <Flex className={styles.additionalParametrs}>
                    <AdditionalParametrs
                        handleReloadTableData={handleReloadTableData}
                        handleResetFilters={handleResetFilters}
                    />
                </Flex>
                <div className={styles.workZoneContainer}>
                    <Flex className={styles.column} vertical>
                        <p className={styles.columnTitle}>Параметры</p>
                        <Form form={parametrsForm}>
                            <List
                                dataSource={PARAMETRS_LIST}
                                className={styles.listContainer}
                                renderItem={(item) => (
                                    <ReportListElement
                                        label={item.label}
                                        name={item.name}
                                    />
                                )}
                            />
                        </Form>
                    </Flex>
                    <ReportWorkZoneComponent
                        isLoadingTableData={isLoadingTableData}
                        isEmptyReport={isEmptyReport}
                    />
                    <Flex className={styles.column} vertical>
                        <p className={styles.columnTitle}>Показатели</p>
                        <Form form={indicatorsForm}>
                            <List
                                dataSource={INDICATOR_LIST}
                                className={styles.listContainer}
                                renderItem={(item) => (
                                    <ReportListElement
                                        label={item.label}
                                        name={item.name}
                                        disabled={isDisabledIndicators(
                                            item.name
                                        )}
                                    />
                                )}
                            />
                        </Form>
                    </Flex>
                </div>
            </Flex>
        </Flex>
    );
};

export default ReportsComponent;
