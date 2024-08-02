import { createSlice } from "@reduxjs/toolkit";

const isCheckedSlice = createSlice({
  name: "isChecked",
  initialState: {
    isChecked: [],
  },

  reducers: {
    //! добавить в массив фильтрацию по заголовку
    addChecked(state, action) {
      const {itemKey, value } = action.payload;
      state.isChecked.push({
        itemKey,
        value,
      });
    },

    //! удалить из массива фильтрацию по заголовку
    removeChecked(state, action) {
      const {value } = action.payload;
      state.isChecked = state.isChecked.filter(
        (item) => item.value !== value
      );
      // state.isChecked = {isChecked: [state.isChecked.filter((item) => item.value !== value)]}
    },

    //! добавление массива
    addAllCheckeds(state, action) {
      const {checked } = action.payload;
      state.isChecked = [...checked];
    },

    //! удаление по ключу для all
    removeAllCheckeds(state, action) {
      const {itemKey } = action.payload;
      state.isChecked = state.isChecked.filter(
        (item) => item.itemKey !== itemKey
      );
    },

    //! сбросить весь фильтр по таблице
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
