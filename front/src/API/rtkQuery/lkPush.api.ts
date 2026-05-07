import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_URL } from '@/constants/env.constant';

export type VapidPublicKeyResponse = {
  publicKey: string;
};

export type PushStatusResponse = {
  subscribed: boolean;
  count: number;
};

// Тело /lk/me/push/subscribe. PushSubscriptionJSON стандартный браузерный тип
// (содержит endpoint + keys + expirationTime). Дополнительно фронт может
// прислать userAgent — сервер хранит его для UI «отписать это устройство».
export type SubscribePushBody = PushSubscriptionJSON & {
  userAgent?: string;
};

export type SubscribePushResponse = {
  id: string;
  subscribed: boolean;
};

const lkPushBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = sessionStorage.getItem('accessToken');
    if (token && token !== 'null') {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const lkPushApi = createApi({
  reducerPath: 'lkPushApi',
  baseQuery: lkPushBaseQuery,
  tagTypes: ['Push'],
  endpoints: (build) => ({
    getVapidPublicKey: build.query<VapidPublicKeyResponse, void>({
      query: () => '/lk/me/push/vapid-public-key',
    }),

    getPushStatus: build.query<PushStatusResponse, void>({
      query: () => '/lk/me/push/status',
      providesTags: ['Push'],
    }),

    subscribePush: build.mutation<SubscribePushResponse, SubscribePushBody>({
      query: (body) => ({
        url: '/lk/me/push/subscribe',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Push'],
    }),

    unsubscribePush: build.mutation<void, { endpoint: string }>({
      query: (body) => ({
        url: '/lk/me/push/subscribe',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['Push'],
    }),

    sendTestPush: build.mutation<void, void>({
      query: () => ({
        url: '/lk/me/push/test',
        method: 'POST',
        body: {},
      }),
    }),
  }),
});

export const {
  useGetVapidPublicKeyQuery,
  useLazyGetVapidPublicKeyQuery,
  useGetPushStatusQuery,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useSendTestPushMutation,
} = lkPushApi;
