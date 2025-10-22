import { FC, useEffect, useMemo, useRef, useState } from "react";
import ReportsComponent from "./Reports.component";
import { useForm, useWatch } from "antd/es/form/Form";
import { IndicatorsFormInstance, ParametrsFormInstance } from "./types";
import { useLazyGetTableReportDataQuery } from "./reports.api";
import { useAppDispatch, useAppSelector } from "../../../hooks/store";
import { setIsReloadButtonLoadingAction, setTableReportData } from "./slice";
import { additionalParametrsSelector } from "./selectors";

const ReportsContainer: FC = () => {
    const [isReloadButtonLoading, setIsReloadButtonLoading] =
        useState<boolean>(false);
    const currentRequestRef = useRef<any>(null);

    const additionalParametrs = useAppSelector(additionalParametrsSelector);

    const [parametrsForm] = useForm<ParametrsFormInstance>();
    const [indicatorsForm] = useForm<IndicatorsFormInstance>();

    const dispatch = useAppDispatch();

    const [
        getTableReportData,
        { data: reportTableData, isFetching: isLoadingTableData },
    ] = useLazyGetTableReportDataQuery();

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
    };

    const reloadTableData = () => {
        return getTableReportData({
            parametrs,
            indicators,
            additionalParametrs,
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
    }, [parametrs, indicators, additionalParametrs]);

    useEffect(() => {
        if (setTableReportData) {
            dispatch(setTableReportData(reportTableData ?? []));
        }
    }, [reportTableData, dispatch]);

    useEffect(() => {
        if (setIsReloadButtonLoadingAction) {
            dispatch(
                setIsReloadButtonLoadingAction(isReloadButtonLoading ?? false)
            );
        }
    }, [isReloadButtonLoading, dispatch]);

    return (
        <ReportsComponent
            parametrsForm={parametrsForm}
            indicatorsForm={indicatorsForm}
            isEmptyReport={isEmptyReport}
            isLoadingTableData={isLoadingTableData}
            isDisabledIndicators={isDisabledIndicators}
            handleReloadTableData={handleReloadTableData}
            handleResetFilters={handleResetFilters}
        />
    );
};

export default ReportsContainer;
