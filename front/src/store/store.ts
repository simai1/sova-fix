import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import editColumTableSlice from './editColumTable/editColumTable.slice.js';
import editInputChecked from './filter/editInputChecked.slice.js';
import isCheckedSlice from './filter/isChecked.slice.js';
import isSamplePoints from './samplePoints/samplePoits';
import { authApi } from '../API/rtkQuery/auth.api';
import { lkApi } from '../API/rtkQuery/lk.api';
import { lkPushApi } from '../API/rtkQuery/lkPush.api';
import { repairRequestsApi } from '../API/rtkQuery/requests.api.js';
import { userObjectsApi } from '../API/rtkQuery/userObjects.api';
import { usersApi } from '../API/rtkQuery/users.api';
import { directoryCategoryApi } from '../modules/DirectoryCategory/directoryCategory.api';
import { reportsApi } from '../pages/AdminPages/Reports/reports.api';
import reportReducer from '../pages/AdminPages/Reports/slice';

const rootReducer = combineReducers({
  isCheckedSlice: isCheckedSlice,
  editInputChecked: editInputChecked,
  editColumTableSlice: editColumTableSlice,
  isSamplePoints: isSamplePoints,
  [directoryCategoryApi.reducerPath]: directoryCategoryApi.reducer,
  [reportsApi.reducerPath]: reportsApi.reducer,
  reportReducer,
  [repairRequestsApi.reducerPath]: repairRequestsApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [lkApi.reducerPath]: lkApi.reducer,
  [lkPushApi.reducerPath]: lkPushApi.reducer,
  [userObjectsApi.reducerPath]: userObjectsApi.reducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['isCheckedSlice', 'editInputChecked'],
  // blacklist: ["editColumTableSlice", "isCheckedSlice"],
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat([
      directoryCategoryApi.middleware,
      reportsApi.middleware,
      repairRequestsApi.middleware,
      authApi.middleware,
      usersApi.middleware,
      lkApi.middleware,
      lkPushApi.middleware,
      userObjectsApi.middleware,
    ]),
});

export const persistor = persistStore(store);
export default store;

export type RootState = ReturnType<typeof rootReducer>;

export type AppStore = typeof store;

export type AppDispatch = AppStore['dispatch'];
