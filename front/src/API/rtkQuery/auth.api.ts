import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_URL } from '@/constants/env.constant';

export type RegisterPublicReq = {
  login: string;
  password: string;
  name: string;
  role: 3 | 4;
};

export type RegisterPublicResp = {
  userId: string;
  login: string;
  name: string;
  role: string;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL, credentials: 'include' }),
  endpoints: (build) => ({
    registerPublic: build.mutation<RegisterPublicResp, RegisterPublicReq>({
      query: (body) => ({
        url: '/auth/register-public',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useRegisterPublicMutation } = authApi;
