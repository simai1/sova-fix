import { combineReducers, configureStore } from "@reduxjs/toolkit";
import isCheckedSlice from "./filter/isChecked.slice.js";
import editInputChecked from "./filter/editInputChecked.slice.js";
import isSamplePoints from "./samplePoints/samplePoits";
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
import { directoryCategoryApi } from "../modules/DirectoryCategory/directoryCategory.api";
import { reportsApi } from "../pages/AdminPages/Reports/reports.api";
import reportReducer from '../pages/AdminPages/Reports/slice'

const rootReducer = combineReducers({
    isCheckedSlice: isCheckedSlice,
    editInputChecked: editInputChecked,
    editColumTableSlice: editColumTableSlice,
    isSamplePoints: isSamplePoints,
    [directoryCategoryApi.reducerPath]: directoryCategoryApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    reportReducer,
});

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["isCheckedSlice", "editInputChecked", "editColumTableSlice"],
    // blacklist: ["editColumTableSlice", "isCheckedSlice"],
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }).concat([directoryCategoryApi.middleware, reportsApi.middleware]),
});

export const persistor = persistStore(store);
export default store;

export type RootState = ReturnType<typeof rootReducer>;

export type AppStore = typeof store;

export type AppDispatch = AppStore["dispatch"];
