import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import { getRefreshPromise, clearAuthSession } from '../API/API';
import { API_URL } from '../constants/env.constant';
import { isNotification } from '../types/typesguards/notification';

const baseQuery = fetchBaseQuery({
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = sessionStorage.getItem('accessToken');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  },
});

const AUTH_PATHS = ['/Authorization', '/reset-password', '/reset-password-request', '/Activate'];
const redirectToLogin = (): void => {
  if (AUTH_PATHS.some((p) => window.location.pathname.startsWith(p))) return;
  window.location.href = '/Authorization';
};

const fetchMainBaseQuery =
  (basePath: string): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =>
  async (args, api, extraOptions) => {
    const updatedArgs: string | FetchArgs =
      typeof args === 'string'
        ? `${API_URL}${basePath}${args.startsWith('/') ? args : `/${args}`}`
        : {
            ...args,
            url: `${API_URL}${basePath}${args.url.startsWith('/') ? args.url : `/${args.url}`}`,
          };

    let result = await baseQuery(updatedArgs, api, extraOptions);

    if (result.error && result.error.status === 401) {
      // Делим один и тот же refresh-promise с axios-интерсептором, чтобы
      // одновременные 401 не делали два параллельных /auth/refresh (второй
      // получит «not found token» — saveToken переписывает запись по userId).
      const newToken = await getRefreshPromise();
      if (newToken) {
        result = await baseQuery(updatedArgs, api, extraOptions);
      } else {
        clearAuthSession();
        redirectToLogin();
      }
    }

    const data = result.error?.data ?? result.data;
    if (isNotification(data)) {
      api.dispatch({
        type: 'app/setNotification',
        payload: data,
      });
    }

    return result;
  };

export default fetchMainBaseQuery;
