import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import withReauth from './withReauth';

import { API_URL } from '@/constants/env.constant';

export type UserObjectsObject = {
  id: string;
  name: string;
  number?: number;
  city?: string;
  unit?: { id: string; name: string } | null;
};

const baseQuery = fetchBaseQuery({
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

export const userObjectsApi = createApi({
  reducerPath: 'userObjectsApi',
  baseQuery: withReauth(baseQuery),
  tagTypes: ['UserObjects', 'AllObjects'],
  endpoints: (build) => ({
    getUserObjects: build.query<string[], string>({
      query: (userId) => `/users/${userId}/objects`,
      transformResponse: (resp: unknown) => {
        const raw = Array.isArray(resp) ? resp : (resp as { objectIds?: unknown })?.objectIds;
        if (!Array.isArray(raw)) return [];
        return (raw as Array<string | { id: string }>).map((item) =>
          typeof item === 'string' ? item : item.id,
        );
      },
      providesTags: (_r, _e, userId) => [{ type: 'UserObjects' as const, id: userId }],
    }),

    setUserObjects: build.mutation<void, { userId: string; objectIds: string[] }>({
      query: ({ userId, objectIds }) => ({
        url: `/users/${userId}/objects`,
        method: 'PUT',
        body: { objectIds },
      }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: 'UserObjects', id: userId }],
    }),

    getAllObjects: build.query<UserObjectsObject[], string>({
      query: (adminUserId) => `/objects?userId=${adminUserId}`,
      providesTags: ['AllObjects'],
    }),
  }),
});

export const {
  useGetUserObjectsQuery,
  useSetUserObjectsMutation,
  useGetAllObjectsQuery,
  useLazyGetUserObjectsQuery,
} = userObjectsApi;
