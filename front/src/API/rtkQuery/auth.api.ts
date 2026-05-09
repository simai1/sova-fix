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
  // Plain pending-токен для ws-handshake страницы Pending: подключаемся через
  // subprotocol pending.<token>, чтобы слышать USER_CONFIRM в реалтайме.
  // Бэкенд хранит только sha256-хеш; этот plain — единственный канал, через
  // который он попадает к клиенту. Сохраняем в sessionStorage (вкладка-scoped),
  // не в localStorage. На случай старого backend-а без поля — делаем optional.
  pendingVerifyToken?: string;
  pendingVerifyTokenExpiresAt?: string;
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
