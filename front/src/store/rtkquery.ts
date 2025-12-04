import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import { API_URL } from '../constants/env.constant';
import { isNotification } from '../types/typesguards/notification';
import { isRefreshResponse } from '../types/typesguards/refresh';

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
      const refreshResponse = await baseQuery(`${API_URL}/auth/refresh`, api, extraOptions);
      if (isRefreshResponse(refreshResponse.data))
        sessionStorage.setItem('accessToken', refreshResponse.data.accessToken);
      if (!refreshResponse.error) {
        result = await baseQuery(updatedArgs, api, extraOptions);
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
