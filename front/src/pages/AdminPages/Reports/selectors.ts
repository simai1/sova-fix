import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";
import { IndicatorsFormInstance, ParametrsFormInstance } from "./types";

const reportReducerBaseSelector = (state: RootState) => state.reportReducer;

export const tableReportDataSelector = createSelector(
    (state: RootState) => state.reportReducer.tableReportData,
    (tableReportData) => tableReportData
);

export const additionalParametrsSelector = createSelector(
    (state: RootState) => state.reportReducer.additionalParametrs,
    (additionalParametrs) => additionalParametrs
);

export const reportTypeSelector = createSelector(
    reportReducerBaseSelector,
    (state) => state.additionalParametrs.reportType
);

export const isGraphicTypeSelector = createSelector(
    reportReducerBaseSelector,
    (state) => state.additionalParametrs.reportType !== "table"
);

export const isReloadButtonLoadingSelector = createSelector(
    (state: RootState) => state.reportReducer.isReloadButtonLoading,
    (isReloadButtonLoading) => isReloadButtonLoading
);

export const filterDataSelector = createSelector(
    (state: RootState) => state.reportReducer.filterData,
    (filterData) => filterData ?? null
);

export const filterDataValuesSelector = createSelector(
    (state: RootState) => state.reportReducer.filterDataValues,
    (filterDataValues) => filterDataValues ?? null
);

// для графика возврашаем единственный выбранный параметр 
export const selectedParameterSelector = createSelector(
    reportReducerBaseSelector,
    (state) => {
        const params = state.parameters;
        if (!params) return null;

        const selected = (
            Object.keys(params) as (keyof ParametrsFormInstance)[]
        ).find((key) => params[key] === true);

        return selected ?? null;
    }
);

// для графика возврашаем единственный выбранный индикатор
export const selectedIndicatorSelector = createSelector(
    reportReducerBaseSelector,
    (state) => {
        const indicators = state.indicators;
        if (!indicators) return null;

        const selected = (
            Object.keys(indicators) as (keyof IndicatorsFormInstance)[]
        ).find((key) => indicators[key] === true);

        return selected ?? null;
    }
);
