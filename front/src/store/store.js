import { combineReducers, configureStore } from "@reduxjs/toolkit";
import isCheckedSlice from "./filter/isChecked.slice.js";
import editInputChecked from "./filter/editInputChecked.slice.js";
import isSamplePoints from "./samplePoints/samplePoits.js";
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
import editColumTableSlice from "./editColumTable/editColumTable.slice.js";

const rootReducer = combineReducers({
  isCheckedSlice: isCheckedSlice,
  editInputChecked: editInputChecked,
  editColumTableSlice: editColumTableSlice,
  isSamplePoints: isSamplePoints,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["isCheckedSlice", "editInputChecked", "editColumTableSlice"],
  // blacklist: ["editColumTableSlice"],
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
