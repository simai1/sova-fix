import { createSlice } from "@reduxjs/toolkit";

const tableDataSlice = createSlice({
  name: "tableData",
  initialState: {
    tableData: {},
  },
  reducers: {
    //! добавить в массив актуальные данные таблицы
    setTableData(state, action) {
      const { tableData } = action.payload;
      // state.tableData = tableData;
      console.log("tableData", tableData);
    }
  },
});

export const {
 
} = tableDataSlice.actions;

export default tableDataSlice.reducer;
