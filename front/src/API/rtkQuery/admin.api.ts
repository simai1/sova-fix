import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import withReauth from './withReauth';

import { API_URL } from '@/constants/env.constant';

export type SystemLogLevel = 'info' | 'warn' | 'error';

export type SystemLogItem = {
  id: string;
  level: SystemLogLevel;
  message: string;
  service: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export type SystemLogsResponse = {
  items: SystemLogItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type GetSystemLogsArgs = {
  level?: SystemLogLevel | 'all';
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  cursor?: string;
};

const baseQueryWithAuth = fetchBaseQuery({
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

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: withReauth(baseQueryWithAuth),
  tagTypes: ['SystemLogs'],
  endpoints: (build) => ({
    getSystemLogs: build.query<SystemLogsResponse, GetSystemLogsArgs | void>({
      query: (args) => {
        const params: Record<string, string | number> = {};
        if (args?.level && args.level !== 'all') params.level = args.level;
        if (args?.from) params.from = args.from;
        if (args?.to) params.to = args.to;
        if (args?.q && args.q.trim().length > 0) params.q = args.q.trim();
        if (args?.limit) params.limit = args.limit;
        if (args?.cursor) params.cursor = args.cursor;
        return { url: '/admin/logs', params };
      },
      providesTags: ['SystemLogs'],
    }),
  }),
});

export const { useGetSystemLogsQuery, useLazyGetSystemLogsQuery } = adminApi;
