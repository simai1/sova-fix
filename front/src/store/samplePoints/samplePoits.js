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
    table9: {
      isChecked: [],
      filters: [],
    },
    table10: {
      isChecked: [],
    },
    table11: {
      isChecked: [],
    },
    table12: {
      isChecked: [],
    },
    table13: {
      isChecked: [],
    },
    table14: {
      isChecked: []
    },
    table15: {
      isChecked: []
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
    },

    //TODO мне нуждно добавлять запись в массив filters если такая запись там уже есть удалять ее из него при этом мне нужно так же проверять что этой записи нет в массиве isChecked
    setFilters(state, action) {
      const { tableName, filter, key } = action.payload;
      const idx = state[tableName].filters.findIndex((item) => item.key === key && item.value === filter);
      if (idx !== -1) {
        state[tableName].filters.splice(idx, 1);
      } else {
        state[tableName].filters.push({key, value: filter});    
      }
    },

    dropFilters(state, action) {
      const { tableName } = action.payload;
      state[tableName].filters = [];
    },
  },
});

export const { setChecked, resetFilters, setFilters, dropFilters } = isSamplePoints.actions;

export default isSamplePoints.reducer;
