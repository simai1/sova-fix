import { FC, useEffect, useMemo, useRef, useState } from "react";
import ReportsComponent from "./Reports.component";
import { useForm, useWatch } from "antd/es/form/Form";
import {
    IndicatorsFormInstance,
    ParametrsFormInstance,
    ReportTable,
    SetIndicatorPayload,
    SetParameterPayload,
} from "./types";
import { useLazyGetTableReportDataQuery } from "./reports.api";
import { useAppDispatch, useAppSelector } from "../../../hooks/store";
import {
    setFilterDataValues,
    setSelectedIndicator,
    setIsReloadButtonLoadingAction,
    setSelectedParameter,
} from "./slice";
import {
    additionalParametrsSelector,
    filterDataValuesSelector,
    isChartsTypeSelector,
    reportTypeSelector,
    tableReportDataSelector,
} from "./selectors";
import { INDICATOR_LIST, PARAMETRS_LIST } from "./constants";

const ReportsContainer: FC = () => {
    const filterDataValues = useAppSelector(filterDataValuesSelector);

    const [isReloadButtonLoading, setIsReloadButtonLoading] =
        useState<boolean>(false);
    const currentRequestRef = useRef<any>(null);

    const additionalParametrs = useAppSelector(additionalParametrsSelector);
    const reportType = useAppSelector(reportTypeSelector);
    const tableReportData = useAppSelector(tableReportDataSelector)

    // Если выбран тип отчета график, то даем возможность выбрать только ОДИН параметр и ОДИН показатель,
    // так как оси на графике две
    const isChartsType = useAppSelector(isChartsTypeSelector);

    const [parametrsForm] = useForm<ParametrsFormInstance>();
    const [indicatorsForm] = useForm<IndicatorsFormInstance>();

    const dispatch = useAppDispatch();

    const [getTableReportData, { isFetching: isLoadingTableData }] =
        useLazyGetTableReportDataQuery();

    const parametrs = useWatch([], parametrsForm);
    const indicators = useWatch([], indicatorsForm);

    const isDisabledIndicators = (name: string): boolean => {
        if (
            !parametrs?.builder &&
            !parametrs?.contractor &&
            !parametrs?.legalEntity &&
            !parametrs?.object &&
            !parametrs?.status &&
            !parametrs?.unit &&
            !parametrs?.urgency
        ) {
            return true;
        }

        if (
            (name === "budgetPlan" || name === "percentOfBudgetPlan") &&
            !parametrs?.object
        ) {
            return true;
        }

        return false;
    };

    const handleResetFilters = () => {
        parametrsForm.resetFields();
        indicatorsForm.resetFields();
        if (setFilterDataValues) {
            dispatch(setFilterDataValues(null));
        }
    };

    const reloadTableData = () => {
        return getTableReportData({
            parametrs,
            indicators,
            additionalParametrs,
            filterData: filterDataValues,
        });
    };

    const handleRequestWithCanceling = async () => {
        if (currentRequestRef.current) {
            currentRequestRef.current.abort();
        }

        await new Promise((resolve) => setTimeout(resolve, 50));

        const promise = reloadTableData();
        currentRequestRef.current = promise;

        try {
            await promise.unwrap();
        } catch (error: any) {
            return;
        }
    };

    const handleReloadTableData = async () => {
        try {
            setIsReloadButtonLoading(true);
            await handleRequestWithCanceling();
        } finally {
            setIsReloadButtonLoading(false);
        }
    };

    const isEmptyReport = useMemo(
        () => Object.values(parametrs || {}).every((value) => !value) || tableReportData.length === 0,
        [parametrs, tableReportData]
    );

    useEffect(() => {
        const handler = setTimeout(() => {
            handleRequestWithCanceling();
        }, 500);

        return () => clearTimeout(handler);
    }, [parametrs, indicators, additionalParametrs, filterDataValues]);

    useEffect(() => {
        if (setIsReloadButtonLoadingAction) {
            dispatch(
                setIsReloadButtonLoadingAction(isReloadButtonLoading ?? false)
            );
        }
    }, [isReloadButtonLoading, dispatch]);

    const handleSetFilterDataValues = (
        fieldName: keyof ReportTable,
        values: string[]
    ) => {
        if (setFilterDataValues) {
            dispatch(
                setFilterDataValues({
                    ...filterDataValues,
                    [fieldName]: values,
                })
            );
        }
    };

    const onValuesParametersChange = (changedValues: ParametrsFormInstance) => {
        const key = Object.keys(
            changedValues
        )[0] as keyof ParametrsFormInstance;
        const value = changedValues[key];

        if (value === false && filterDataValues && filterDataValues[key]) {
            // создаём новый объект без этого ключа
            const newFilterData = { ...filterDataValues };
            delete newFilterData[key];

            // если объект пустой после удаления → null
            const result =
                Object.keys(newFilterData).length > 0 ? newFilterData : null;

            if (setFilterDataValues) {
                dispatch(setFilterDataValues(result));
            }
        }

        if (setSelectedParameter) {
            const payload: SetParameterPayload = {
                type: key,
                value,
            };
            dispatch(setSelectedParameter(payload));
        }

        if (!isChartsType) return;

        // Параметры:
        if (PARAMETRS_LIST.some((p) => p.name === key)) {
            const updatedValues: any = {};

            PARAMETRS_LIST.forEach((p) => {
                updatedValues[p.name] = p.name === key ? value : false;
            });

            parametrsForm.setFieldsValue(updatedValues);
            return;
        }
    };

    const onValuesIndicatorsChange = (
        changedValues: IndicatorsFormInstance
    ) => {
        if (!isChartsType) return;
        const key = Object.keys(
            changedValues
        )[0] as keyof IndicatorsFormInstance;
        const value = changedValues[key];
        if (setSelectedIndicator) {
            const payload: SetIndicatorPayload = {
                type: key,
                value,
            };
            dispatch(setSelectedIndicator(payload));
        }
        // Показатели:
        if (INDICATOR_LIST.some((i) => i.name === key)) {
            const updatedValues: any = {};

            INDICATOR_LIST.forEach((i) => {
                updatedValues[i.name] = i.name === key ? value : false;
            });

            indicatorsForm.setFieldsValue(updatedValues);
            return;
        }
    };

    useEffect(() => {
        handleResetFilters();
    }, [reportType]);

    return (
        <ReportsComponent
            parametrsForm={parametrsForm}
            indicatorsForm={indicatorsForm}
            isEmptyReport={isEmptyReport}
            isLoadingTableData={isLoadingTableData}
            handleSetFilterDataValues={handleSetFilterDataValues}
            isDisabledIndicators={isDisabledIndicators}
            handleReloadTableData={handleReloadTableData}
            handleResetFilters={handleResetFilters}
            onValuesParametersChange={onValuesParametersChange}
            onValuesIndicatorsChange={onValuesIndicatorsChange}
        />
    );
};

export default ReportsContainer;
