import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
  baseQuery,
  tagTypes: ['UserObjects', 'AllObjects'],
  endpoints: (build) => ({
    getUserObjects: build.query<string[], string>({
      query: (userId) => `/users/${userId}/objects`,
      transformResponse: (resp: unknown) => {
        if (Array.isArray(resp)) {
          // Принимаем либо массив id, либо массив объектов с id (бэкенд может вернуть оба варианта)
          return (resp as Array<string | { id: string }>).map((item) =>
            typeof item === 'string' ? item : item.id,
          );
        }
        return [];
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

    getAllObjects: build.query<UserObjectsObject[], void>({
      query: () => '/objects',
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
