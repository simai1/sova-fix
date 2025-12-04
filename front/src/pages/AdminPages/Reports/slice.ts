import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';

import { reportsApi } from './reports.api';
import { isRowEmpty } from './ReportWorkZone/ReportTable/utils';
import {
  AdditionalParametrsI,
  ReportInitialState,
  ReportTable,
  SetIndicatorPayload,
  SetParameterPayload,
} from './types';

const initialState: ReportInitialState = {
  tableReportData: [],
  isReloadButtonLoading: false,
  additionalParametrs: {
    dynamicsTypes: [],
    isResult: false,
    reportType: 'table',
  },
  filterData: null,
  filterDataValues: null,
  parameters: {
    unit: false,
    status: false,
    legalEntity: false,
    contractor: false,
    builder: false,
    urgency: false,
    object: false,
  },
  indicators: {
    totalCountRequests: false,
    percentOfBudgetPlan: false,
    percentOfTotalCountRequest: false,
    closingSpeedOfRequests: false,
    budget: false,
    budgetPlan: false,
  },
};

export const reportSlice: Slice<ReportInitialState> = createSlice({
  name: 'reportSlice',
  initialState,
  reducers: {
    setAdditionalParametrs: (state, action: PayloadAction<AdditionalParametrsI>) => {
      state.additionalParametrs = action.payload;
    },
    setIsReloadButtonLoadingAction: (state, action: PayloadAction<boolean>) => {
      state.isReloadButtonLoading = action.payload;
    },
    setFilterDataValues: (
      state,
      action: PayloadAction<Record<keyof ReportTable, string[]> | null>,
    ) => {
      if (action.payload) {
        state.filterDataValues = action.payload;
        return;
      }
      state.filterDataValues = action.payload;
    },
    setSelectedParameter: (state, action: PayloadAction<SetParameterPayload>) => {
      const { type, value } = action.payload;
      if (!value) {
        // если value = false, просто сбросить этот параметр
        state.parameters[type] = false;
        return;
      }

      // устанавливаем выбранный параметр в true, все остальные в false
      Object.keys(state.parameters).forEach((key) => {
        state.parameters[key as keyof typeof state.parameters] = key === type;
      });
    },
    setSelectedIndicator: (state, action: PayloadAction<SetIndicatorPayload>) => {
      const { type, value } = action.payload;
      if (!value) {
        // если value = false, просто сбросить этот индикатор
        state.indicators[type] = false;
        return;
      }

      // устанавливаем выбранный индикатор в true, все остальные в false
      Object.keys(state.indicators).forEach((key) => {
        state.indicators[key as keyof typeof state.indicators] = key === type;
      });
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(reportsApi.endpoints.getTableReportData.matchFulfilled, (state, action) => {
      state.tableReportData = action.payload.resultRows.filter((row) => !isRowEmpty(row));
      state.filterData = action.payload.filterData;
    });
  },
});

export const {
  setAdditionalParametrs,
  setIsReloadButtonLoadingAction,
  setFilterDataValues,
  setSelectedParameter,
  setSelectedIndicator,
} = reportSlice.actions;

export default reportSlice.reducer;
