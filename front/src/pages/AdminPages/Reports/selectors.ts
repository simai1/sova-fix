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