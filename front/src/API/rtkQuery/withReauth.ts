import { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

import { getRefreshPromise, clearAuthSession } from '../API';

const AUTH_PATHS = ['/Authorization', '/reset-password', '/reset-password-request', '/Activate'];

const redirectToLogin = (): void => {
  if (AUTH_PATHS.some((p) => window.location.pathname.startsWith(p))) return;
  window.location.href = '/Authorization';
};

const withReauth =
  (
    baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
  ): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =>
  async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401) {
      const newToken = await getRefreshPromise();
      if (newToken) {
        result = await baseQuery(args, api, extraOptions);
      } else {
        clearAuthSession();
        redirectToLogin();
      }
    }
    return result;
  };

export default withReauth;
