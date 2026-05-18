import { createSlice } from "@reduxjs/toolkit";

const isCheckedSlice = createSlice({
  name: "isChecked",
  initialState: {
    isChecked: [],
  },

  reducers: {
    addChecked(state, action) {
      const {itemKey, value } = action.payload;
      state.isChecked.push({
        itemKey,
        value,
      });
    },

    removeChecked(state, action) {
      const {value } = action.payload;
      state.isChecked = state.isChecked.filter(
        (item) => item.value !== value
      );
    },

    addAllCheckeds(state, action) {
      const {checked } = action.payload;
      state.isChecked = [...checked];
    },

    removeAllCheckeds(state, action) {
      const {itemKey } = action.payload;
      state.isChecked = state.isChecked.filter(
        (item) => item.itemKey !== itemKey
      );
    },

    removeTableCheckeds(state) {
      state.isChecked = [];
    },
  },
});

export const {
  addChecked,
  removeChecked,
  addAllCheckeds,
  removeAllCheckeds,
  removeTableCheckeds,
} = isCheckedSlice.actions;

export default isCheckedSlice.reducer;
