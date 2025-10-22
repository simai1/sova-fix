import { createSlice, PayloadAction, Slice } from "@reduxjs/toolkit";
import { AdditionalParametrsI, ReportInitialState, ReportTable } from "./types";

const initialState: ReportInitialState = {
    tableReportData: [],
    isReloadButtonLoading: false,
    additionalParametrs: {
        dynamicsType: null,
        isResult: false,
        reportType: 0,
    },
};

export const reportSlice: Slice<ReportInitialState> = createSlice({
    name: "reportSlice",
    initialState,
    reducers: {
        setTableReportData: (state, action: PayloadAction<ReportTable[]>) => {
            state.tableReportData = action.payload;
        },
        setAdditionalParametrs: (
            state,
            action: PayloadAction<AdditionalParametrsI>
        ) => {
            state.additionalParametrs = action.payload;
        },
        setIsReloadButtonLoadingAction: (state, action: PayloadAction<boolean>) => {
            state.isReloadButtonLoading = action.payload;
        },
    },
});

export const {
    setTableReportData,
    setAdditionalParametrs,
    setIsReloadButtonLoadingAction,
} = reportSlice.actions;

export default reportSlice.reducer;
