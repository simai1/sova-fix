import { combineReducers, configureStore } from "@reduxjs/toolkit";
import isCheckedSlice from "./filter/isChecked.slice.js";
import editInputChecked from "./filter/editInputChecked.slice.js";

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import tableDataSlice from "./tableData/tableData.slice.js";
import editColumTableSlice from "./editColumTable/editColumTable.slice.js";

const rootReducer = combineReducers({
  isCheckedSlice: isCheckedSlice,
  editInputChecked: editInputChecked,
  tableDataSlice: tableDataSlice,
  editColumTableSlice: editColumTableSlice
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["isCheckedSlice", "editInputChecked", "tableDataSlice",],
  blacklist: ["editColumTableSlice"],
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
