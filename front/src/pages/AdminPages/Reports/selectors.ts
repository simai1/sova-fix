import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";

export const tableReportDataSelector = createSelector(
    (state: RootState) => state.reportReducer.tableReportData,
    (tableReportData) => tableReportData
);

export const additionalParametrsSelector = createSelector(
    (state: RootState) => state.reportReducer.additionalParametrs,
    (additionalParametrs) => additionalParametrs
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