import { createSlice } from "@reduxjs/toolkit";

const isSamplePoints = createSlice({
  name: "isSamplePoints",
  initialState: {
    table1: {
      isChecked: [],
    },
    table2: {
      isChecked: [],
    },
    table3: {
      isChecked: [],
    },
    table4: {
      isChecked: [],
    },
    table5: {
      isChecked: [],
    },
    table6: {
      isChecked: [],
    },
    table7: {
      isChecked: [],
    },
    table8: {
      isChecked: [],
    },
  },

  reducers: {
    //! добавить в массив фильтрацию по заголовку
    setChecked(state, action) {
      const { tableName, checked } = action.payload;
      state[tableName].isChecked = checked;
    },

    resetFilters(state, action) {
      const { tableName } = action.payload;
      state[tableName].isChecked = [];
    }
  },
});

export const { setChecked, resetFilters } = isSamplePoints.actions;

export default isSamplePoints.reducer;
