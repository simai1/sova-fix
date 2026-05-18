import { createSlice } from "@reduxjs/toolkit";

const editInputChecked = createSlice({
  name: "editInputCheckeds",
  initialState: {
    editInputCheckeds: {},
  },

  reducers: {
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

    removeChecked(state, action) {
      const { tableName, key } = action.payload;
      if (!state.editInputCheckeds[tableName]) {
        state.editInputCheckeds[tableName] = [];
      }
      state.editInputCheckeds[tableName] = state.editInputCheckeds[
        tableName
      ].filter((item) => item.key !== key);
    },

    addAllCheckeds(state, action) {
      const { tableName, checked } = action.payload;
      if (!state.editInputCheckeds[tableName]) {
        state.editInputCheckeds[tableName] = [];
      }
      state.editInputCheckeds[tableName] = [...checked];
    },

    removeAllCheckeds(state, action) {
      const { tableName, key } = action.payload;
      if (!state.editInputCheckeds[tableName]) {
        state.editInputCheckeds[tableName] = [];
      }
      state.editInputCheckeds[tableName] = [];
    },

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
