import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_URL } from '@/constants/env.constant';

export type PendingUser = {
  id: string;
  login: string;
  name: string;
  role: string;
  createdAt: string;
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

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['PendingUsers'],
  endpoints: (build) => ({
    getPendingRegistrations: build.query<PendingUser[], void>({
      query: () => '/users/pending-registrations',
      providesTags: ['PendingUsers'],
    }),
    approveUser: build.mutation<unknown, string>({
      query: (userId) => ({
        url: `/users/${userId}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['PendingUsers'],
    }),
    deleteUser: build.mutation<unknown, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PendingUsers'],
    }),
  }),
});

export const { useGetPendingRegistrationsQuery, useApproveUserMutation, useDeleteUserMutation } =
  usersApi;
