import { createSlice } from "@reduxjs/toolkit";
import { tableHeadAppoint } from "../../components/Table/Data";

// Function to initialize the state with isActive set to true
const initializeColumns = () => {
  return tableHeadAppoint.map(column => ({ ...column, isActive: true }));
};

// Function to check if all columns are active
const areAllColumnsActive = (columns) => {
  return columns.every(column => column.isActive);
};

const editColumTable = createSlice({
  name: "ColumTable",
  initialState: {
    AllColumTable: tableHeadAppoint, // Original data without flags
    ActiveColumTable: initializeColumns(), // Initialize with flags set to true
    AllCheckbox: true, // Initially set to true since all columns are active
    HistoryTableData: [],
  },

  reducers: {
    addTableHeader: (state, action) => {
      state.ActiveColumTable = action.payload;
      state.AllCheckbox = areAllColumnsActive(state.ActiveColumTable);
    },

    onCheckState: (state, action) => {
      const {key, isActive} = action.payload;
      state.ActiveColumTable = state.ActiveColumTable.map((el) => {
        if (el.key === key) {
          return { ...el, isActive: !el.isActive }; // Toggle isActive
        }
        return el; // Return unchanged element
      });
      state.AllCheckbox = areAllColumnsActive(state.ActiveColumTable);
    },

    resetAllColumns: (state) => {
      state.ActiveColumTable = state.ActiveColumTable.map(el => ({ ...el, isActive: !state.AllCheckbox }));
      state.AllCheckbox = !state.AllCheckbox;
    },
  },
});

export const {
  onCheckState,
  addTableHeader,
  resetAllColumns
} = editColumTable.actions;

export default editColumTable.reducer;
