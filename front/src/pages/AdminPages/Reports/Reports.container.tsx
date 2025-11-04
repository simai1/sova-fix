import { FC, useEffect, useMemo, useRef, useState } from "react";
import ReportsComponent from "./Reports.component";
import { useForm, useWatch } from "antd/es/form/Form";
import {
    IndicatorsFormInstance,
    ParametrsFormInstance,
    ReportTable,
} from "./types";
import { useLazyGetTableReportDataQuery } from "./reports.api";
import { useAppDispatch, useAppSelector } from "../../../hooks/store";
import { setFilterDataValues, setIsReloadButtonLoadingAction } from "./slice";
import {
    additionalParametrsSelector,
    filterDataValuesSelector,
} from "./selectors";

const ReportsContainer: FC = () => {
    const filterDataValues = useAppSelector(filterDataValuesSelector);

    const [isReloadButtonLoading, setIsReloadButtonLoading] =
        useState<boolean>(false);
    const currentRequestRef = useRef<any>(null);

    const additionalParametrs = useAppSelector(additionalParametrsSelector);

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
        () => Object.values(parametrs || {}).every((value) => !value),
        [parametrs]
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
            dispatch(setFilterDataValues({ ...filterDataValues, [fieldName]: values }));
        }
    };

    const onValuesChange = (changedValues: ParametrsFormInstance) => {
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
    };

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
            onValuesChange={onValuesChange}
        />
    );
};

export default ReportsContainer;
