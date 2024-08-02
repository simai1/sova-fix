import { createSlice } from "@reduxjs/toolkit";

const editInputChecked = createSlice({
  name: "editInputCheckeds",
  initialState: {
    editInputCheckeds: {},
  },

  reducers: {
    //! добавить в массив фильтрацию по заголовку
    addChecked(state, action) {
      const { tableName, key, label } = action.payload;
      if (!state.editInputCheckeds[tableName]) {
        state.editInputCheckeds[tableName] = [];
      }
      state.editInputCheckeds[tableName].push({
        key,
        label,
      });
    },

    //! удалить из массива фильтрацию по заголовку
    removeChecked(state, action) {
      const { tableName, key } = action.payload;
      if (!state.editInputCheckeds[tableName]) {
        state.editInputCheckeds[tableName] = [];
      }
      state.editInputCheckeds[tableName] = state.editInputCheckeds[
        tableName
      ].filter((item) => item.key !== key);
    },

    //! добавление массива
    addAllCheckeds(state, action) {
      const { tableName, checked } = action.payload;
      if (!state.editInputCheckeds[tableName]) {
        state.editInputCheckeds[tableName] = [];
      }
      state.editInputCheckeds[tableName] = [...checked];
    },

    //! удаление по ключу для all
    removeAllCheckeds(state, action) {
      const { tableName, key } = action.payload;
      if (!state.editInputCheckeds[tableName]) {
        state.editInputCheckeds[tableName] = [];
      }
      state.editInputCheckeds[tableName] = [];
    },

    //! сбросить весь фильтр по таблице
    removeTableCheckeds(state, action) {
      const { tableName } = action.payload;
      if (!state.editInputCheckeds[tableName]) {
        state.editInputCheckeds[tableName] = [];
      }
      state.editInputCheckeds[tableName] = [];
    },
  },
});

export const {
  addChecked,
  removeChecked,
  addAllCheckeds,
  removeAllCheckeds,
  removeTableCheckeds,
} = editInputChecked.actions;

export default editInputChecked.reducer;
