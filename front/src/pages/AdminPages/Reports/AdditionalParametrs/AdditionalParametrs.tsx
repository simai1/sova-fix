import { FC, useEffect } from "react";
import locale from "antd/locale/ru_RU";
import {
    Flex,
    DatePicker,
    ConfigProvider,
    Select,
    Form,
    Dropdown,
    TreeSelect,
} from "antd";
import styles from "./styles.module.scss";
import { dynamicsTypeOptions, periodOptions } from "./constants";
import AntCheckbox from "../../../../UI/Antd/AntCheckbox/AntCheckbox";
import AntButton from "../../../../UI/Antd/AntButton/AntButton";
import { AdditionalParametrsForm, AdditionalParametrsI } from "../types";
import { useForm, useWatch } from "antd/es/form/Form";
import { useAppDispatch, useAppSelector } from "../../../../hooks/store";
import {
    additionalParametrsSelector,
    isReloadButtonLoadingSelector,
    tableReportDataSelector,
} from "../selectors";
import { setAdditionalParametrs } from "../slice";
import { REPORT_TYPES } from "../constants";
import { exportToExcel } from "../ReportWorkZone/ReportTable/utils";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { SyncOutlined } from "@ant-design/icons";
import { AdditionalParametrsProps } from "./types";

dayjs.extend(isoWeek);
const { RangePicker } = DatePicker;

const AdditionalParametrs: FC<AdditionalParametrsProps> = ({
    handleReloadTableData,
    handleResetFilters,
}) => {
    const [form] = useForm<AdditionalParametrsForm>();
    const additionalParametrs = useWatch([], form);

    const additionalInitialValues = useAppSelector(additionalParametrsSelector);
    const tableReportData = useAppSelector(tableReportDataSelector);
    const isReloadButtonLoading = useAppSelector(isReloadButtonLoadingSelector);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!setAdditionalParametrs) return;

        const payload: AdditionalParametrsI = {
            isResult: additionalParametrs?.isResult ?? false,
            dynamicsTypes: additionalParametrs?.dynamicsTypes ?? [],
            reportType: additionalParametrs?.reportType ?? 0,
            dateStart: null,
            dateEnd: null,
        };

        const picker = additionalParametrs?.periodPicker;
        if (picker && picker[0] && picker[1]) {
            const start = picker[0];
            const end = picker[1];

            payload.dateStart = start.startOf("day").toISOString();
            payload.dateEnd = end.endOf("day").toISOString();
        }

        dispatch(setAdditionalParametrs(payload));
    }, [additionalParametrs, dispatch]);

    useEffect(() => {
        const value = form.getFieldValue("periodDropdown");
        if (!value) return;

        let start: dayjs.Dayjs | null = null;
        let end: dayjs.Dayjs | null = null;
        const now = dayjs();

        switch (value) {
            case "today":
                start = now.startOf("day");
                end = now.endOf("day");
                break;
            case "yesterday":
                start = now.subtract(1, "day").startOf("day");
                end = now.subtract(1, "day").endOf("day");
                break;
            case "currentWeek":
                start = now.startOf("isoWeek");
                end = now.endOf("isoWeek");
                break;
            case "lastWeek":
                start = now.subtract(1, "week").startOf("isoWeek");
                end = now.subtract(1, "week").endOf("isoWeek");
                break;
            case "currentMonth":
                start = now.startOf("month");
                end = now.endOf("month");
                break;
            case "lastMonth":
                start = now.subtract(1, "month").startOf("month");
                end = now.subtract(1, "month").endOf("month");
                break;
            case "currentYear":
                start = now.startOf("year");
                end = now.endOf("year");
                break;
            case "lastYear":
                start = now.subtract(1, "year").startOf("year");
                end = now.subtract(1, "year").endOf("year");
                break;
            case "allTime":
                start = null;
                end = null;
                break;
        }

        form.setFieldValue(
            "periodPicker",
            start && end ? [start, end] : undefined
        );
    }, [form, form.getFieldValue("periodDropdown")]);

    const handleRangeChange = () => {
        form.setFieldValue("periodDropdown", undefined);
    };

    const handleResetFiltersWithAdditionals = () => {
        form.resetFields();
        form.setFieldsValue({
            isResult: false,
            dynamicsTypes: [],
        });
        handleResetFilters();
    };

    useEffect(() => {
        handleResetFiltersWithAdditionals();
    }, []);

    return (
        <Flex
            align="center"
            justify="space-between"
            className={styles.container}
        >
            <ConfigProvider locale={locale}>
                <Flex vertical gap={10} className={styles.content}>
                    <Flex gap={10}>
                        <AntButton
                            colorVariant="brown"
                            onClick={handleReloadTableData}
                            loading={
                                isReloadButtonLoading
                                    ? { icon: <SyncOutlined spin /> }
                                    : false
                            }
                        >
                            Обновить
                        </AntButton>
                        <AntButton
                            colorVariant="brown"
                            onClick={handleResetFiltersWithAdditionals}
                        >
                            Очистить отчёт
                        </AntButton>
                    </Flex>
                    <Form
                        className={styles.form}
                        initialValues={additionalInitialValues}
                        form={form}
                    >
                        <Flex align="center" gap={20}>
                            <Form.Item<AdditionalParametrsForm>
                                noStyle
                                name="periodPicker"
                            >
                                <RangePicker
                                    className={styles.rangePicker}
                                    placeholder={["Начало", "Конец"]}
                                    format={"DD.MM.YYYY"}
                                    onChange={handleRangeChange}
                                />
                            </Form.Item>
                            <Form.Item<AdditionalParametrsForm>
                                noStyle
                                name="periodDropdown"
                            >
                                <Select
                                    options={periodOptions}
                                    allowClear
                                    placeholder="Период"
                                    className={styles.select}
                                />
                            </Form.Item>
                            <div className={styles.selectContainer}>
                                <Form.Item<AdditionalParametrsForm>
                                    name="dynamicsTypes"
                                    noStyle
                                >
                                    <TreeSelect
                                        treeData={dynamicsTypeOptions}
                                        placeholder="Динамика"
                                        className={styles.select}
                                        treeCheckable
                                    />
                                </Form.Item>
                            </div>
                            <div style={{ width: 160 }}>
                                <Form.Item<AdditionalParametrsForm>
                                    name="isResult"
                                    noStyle
                                    valuePropName="checked"
                                >
                                    <AntCheckbox>Итог по столбцу</AntCheckbox>
                                </Form.Item>
                            </div>
                        </Flex>
                        <Flex gap={10}>
                            <Form.Item<AdditionalParametrsForm>
                                name="reportType"
                                noStyle
                            >
                                <Select
                                    placeholder="Тип отчета"
                                    className={styles.select}
                                    options={REPORT_TYPES}
                                />
                            </Form.Item>
                            <Dropdown
                                trigger={["click"]}
                                menu={{
                                    items: [
                                        {
                                            key: "xlsx",
                                            label: (
                                                <div
                                                    onClick={() =>
                                                        exportToExcel(
                                                            tableReportData
                                                        )
                                                    }
                                                >
                                                    xlsx
                                                </div>
                                            ),
                                        },
                                    ],
                                }}
                            >
                                <AntButton colorVariant="brown">
                                    Экспорт
                                </AntButton>
                            </Dropdown>
                        </Flex>
                    </Form>
                </Flex>
            </ConfigProvider>
        </Flex>
    );
};

export default AdditionalParametrs;
