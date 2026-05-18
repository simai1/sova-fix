import { createSlice } from '@reduxjs/toolkit';

import { tableHeadAppoint } from '../../components/Table/Data.js';
import { ColumnI } from '../../types/column.type.js';
import { TEditColumnState } from '../../types/store/editColumnSlice.js';

const initializeColumns = (): ColumnI[] => {
  return tableHeadAppoint.map((column: ColumnI) => ({ ...column, isActive: true }));
};

const areAllColumnsActive = (columns: ColumnI[]) => {
  return columns.every((column) => column.isActive);
};

const initialState: TEditColumnState = {
  AllColumTable: tableHeadAppoint,
  ActiveColumTable: initializeColumns(),
  AllCheckbox: true,
};

const editColumTable = createSlice({
  name: 'ColumTable',
  initialState,
  reducers: {
    addTableHeader: (state, action) => {
      state.ActiveColumTable = action.payload;
      state.AllCheckbox = areAllColumnsActive(state.ActiveColumTable);
    },

    onCheckState: (state, action) => {
      const { key } = action.payload;
      state.ActiveColumTable = state.ActiveColumTable.map((el) => {
        if (el.key === key) {
          return { ...el, isActive: !el.isActive };
        }
        return el;
      });
      state.AllCheckbox = areAllColumnsActive(state.ActiveColumTable);
    },

    resetAllColumns: (state) => {
      state.ActiveColumTable = [
        ...state.ActiveColumTable.slice(0, 3),
        ...state.ActiveColumTable.slice(3).map((el) => ({
          ...el,
          isActive: !state.AllCheckbox,
        })),
      ];
      state.AllCheckbox = !state.AllCheckbox;
    },
  },
});

export const { onCheckState, addTableHeader, resetAllColumns } = editColumTable.actions;

export default editColumTable.reducer;
