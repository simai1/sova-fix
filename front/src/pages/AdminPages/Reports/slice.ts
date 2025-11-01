import { createSlice, PayloadAction, Slice } from "@reduxjs/toolkit";
import { AdditionalParametrsI, ReportInitialState, ReportTable } from "./types";
import { reportsApi } from "./reports.api";

const initialState: ReportInitialState = {
    tableReportData: [],
    isReloadButtonLoading: false,
    additionalParametrs: {
        dynamicsTypes: [],
        isResult: false,
        reportType: 0,
    },
    filterData: null,
    filterDataValues: null
};

export const reportSlice: Slice<ReportInitialState> = createSlice({
    name: "reportSlice",
    initialState,
    reducers: {
        setAdditionalParametrs: (
            state,
            action: PayloadAction<AdditionalParametrsI>
        ) => {
            state.additionalParametrs = action.payload;
        },
        setIsReloadButtonLoadingAction: (
            state,
            action: PayloadAction<boolean>
        ) => {
            state.isReloadButtonLoading = action.payload;
        },
        setFilterDataValues: (state, action: PayloadAction<Record<keyof ReportTable, string[]> | null>) => {
            if (action.payload) {
                state.filterDataValues = action.payload
                return
            }
            state.filterDataValues = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(
            reportsApi.endpoints.getTableReportData.matchFulfilled,
            (state, action) => {
                state.tableReportData = action.payload.resultRows;
                state.filterData = action.payload.filterData
            }
        );
    },
});

export const {
    setAdditionalParametrs,
    setIsReloadButtonLoadingAction,
    setFilterDataValues,
} = reportSlice.actions;

export default reportSlice.reducer;
