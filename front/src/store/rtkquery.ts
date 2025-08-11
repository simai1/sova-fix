import {
    BaseQueryFn,
    FetchArgs,
    fetchBaseQuery,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { isRefreshResponse } from "../types/typesguards/refresh";
import { isNotification } from "../types/typesguards/notification";

const baseQuery = fetchBaseQuery({
    credentials: "include",
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('token')

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return headers;
    },
});
const fetchMainBaseQuery =
  (
    basePath: string,
  ): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =>
  async (args, api, extraOptions) => {
    const updatedArgs: string | FetchArgs =
      typeof args === "string"
        ? `${process.env.REACT_APP_API_URL}${basePath}${args.startsWith("/") ? args : `/${args}`}`
        : {
            ...args,
            url: `${process.env.REACT_APP_API_URL}${basePath}${args.url.startsWith("/") ? args.url : `/${args.url}`}`,
          };

    let result = await baseQuery(updatedArgs, api, extraOptions);

    if (result.error && result.error.status === 401) {
      const refreshResponse = await baseQuery(
        `${process.env.REACT_APP_API_URL}/auth/refresh`,
        api,
        extraOptions,
      );
      if (isRefreshResponse(refreshResponse.data)) 
        localStorage.setItem("token", refreshResponse.data.accessToken);
      if (!refreshResponse.error) {
        result = await baseQuery(updatedArgs, api, extraOptions);
      }
    }

    const data = result.error?.data ?? result.data;
    if (isNotification(data)) {
      api.dispatch({
        type: "app/setNotification",
        payload: data,
      });
    }

    return result;
  };

export default fetchMainBaseQuery;