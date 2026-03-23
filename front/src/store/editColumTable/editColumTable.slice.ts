import { createSlice } from '@reduxjs/toolkit';

import { tableHeadAppoint } from '../../components/Table/Data.js';
import { ColumnI } from '../../types/column.type.js';
import { TEditColumnState } from '../../types/store/editColumnSlice.js';

// Function to initialize the state with isActive set to true
const initializeColumns = (): ColumnI[] => {
  return tableHeadAppoint.map((column: ColumnI) => ({ ...column, isActive: true }));
};

// Function to check if all columns are active
const areAllColumnsActive = (columns: ColumnI[]) => {
  return columns.every((column) => column.isActive);
};

const initialState: TEditColumnState = {
  AllColumTable: tableHeadAppoint, // Original data without flags
  ActiveColumTable: initializeColumns(), // Initialize with flags set to true
  AllCheckbox: true, // Initially set to true since all columns are active
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
          return { ...el, isActive: !el.isActive }; // Toggle isActive
        }
        return el; // Return unchanged element
      });
      state.AllCheckbox = areAllColumnsActive(state.ActiveColumTable);
    },

    resetAllColumns: (state) => {
      state.ActiveColumTable = [
        ...state.ActiveColumTable.slice(0, 3), // Keep the first three elements unchanged
        ...state.ActiveColumTable.slice(3).map((el) => ({
          ...el,
          isActive: !state.AllCheckbox,
        })), // Update the rest
      ];
      state.AllCheckbox = !state.AllCheckbox;
    },
  },
});

export const { onCheckState, addTableHeader, resetAllColumns } = editColumTable.actions;

export default editColumTable.reducer;
