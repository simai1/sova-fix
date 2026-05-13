import { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

import { getRefreshPromise, clearAuthSession } from '../API';

// Страницы, на которых редирект «обратно на логин» бесполезен (мы уже там).
const AUTH_PATHS = ['/Authorization', '/reset-password', '/reset-password-request', '/Activate'];

const redirectToLogin = (): void => {
  if (AUTH_PATHS.some((p) => window.location.pathname.startsWith(p))) return;
  window.location.href = '/Authorization';
};

// Оборачивает любой fetchBaseQuery в reauth-логику:
//  1) при 401 пытается silent refresh через общий getRefreshPromise (общий с axios
//     interceptor’ом из API.js — иначе одновременные 401 на разные endpoint’ы
//     запустят два параллельных /auth/refresh, второй получит «not found token»);
//  2) при успехе повторяет исходный запрос;
//  3) при неудаче — чистит sessionStorage и редиректит на /Authorization
//     (исключая сами auth-страницы — там цикла быть не должно).
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
