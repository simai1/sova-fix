import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Filter {
  key: string;
  value: any;
}

export interface TableState {
  isChecked: any[];
  filters: Filter[];
}

export interface SamplePointsState {
  [tableName: string]: TableState | undefined; // Может быть undefined по индексу
}

export const createEmptyTableState = (): TableState => ({
  isChecked: [],
  filters: [],
});

const initialState: SamplePointsState = {
  table1: createEmptyTableState(),
  table2: createEmptyTableState(),
  table3: createEmptyTableState(),
  table4: createEmptyTableState(),
  table5: createEmptyTableState(),
  table6: createEmptyTableState(),
  table7: createEmptyTableState(),
  table8: createEmptyTableState(),
  table9: createEmptyTableState(),
  table10: createEmptyTableState(),
  table11: createEmptyTableState(),
  table12: createEmptyTableState(),
  table13: createEmptyTableState(),
  table14: createEmptyTableState(),
  table15: createEmptyTableState(),
  table16: createEmptyTableState(),
};

const isSamplePoints = createSlice({
  name: 'isSamplePoints',
  initialState,
  reducers: {
    setChecked(state, action: PayloadAction<{ tableName: string; checked: any[] }>) {
      const { tableName, checked } = action.payload;
      if (!state[tableName]) {
        state[tableName] = createEmptyTableState();
      }
      state[tableName]!.isChecked = checked;
    },

    resetFilters(state, action: PayloadAction<{ tableName: string }>) {
      const { tableName } = action.payload;
      if (!state[tableName]) {
        state[tableName] = createEmptyTableState();
      }
      state[tableName]!.isChecked = [];
      state[tableName]!.filters = [];
    },

    setFilters(state, action: PayloadAction<{ tableName: string; filter: any; key: string }>) {
      const { tableName, filter, key } = action.payload;
      if (!state[tableName]) {
        state[tableName] = createEmptyTableState();
      }
      const filters = state[tableName]!.filters;
      const idx = filters.findIndex((item) => item.key === key && item.value === filter);

      const isChecked = state[tableName]!.isChecked;
      const existsInChecked = isChecked.includes(filter);

      if (idx !== -1) {
        filters.splice(idx, 1);
      } else if (!existsInChecked) {
        filters.push({ key, value: filter });
      }
    },

    dropFilters(state, action: PayloadAction<{ tableName: string }>) {
      const { tableName } = action.payload;
      if (!state[tableName]) {
        state[tableName] = createEmptyTableState();
      }
      state[tableName]!.filters = [];
    },
  },
});

export const { setChecked, resetFilters, setFilters, dropFilters } = isSamplePoints.actions;
export default isSamplePoints.reducer;
