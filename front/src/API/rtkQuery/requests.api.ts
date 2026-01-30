import { createApi } from '@reduxjs/toolkit/query/react';

import {
  IGetAllObjectsPayload,
  IGetOneRequestPayload,
  IUpdateRequestPayload,
} from './types/requests.types';
import fetchMainBaseQuery from '../../store/rtkquery';
import { TObject } from '../../types/object.types';
import { TRequest } from '../../types/request.types';

export const repairRequestsApi = createApi({
  reducerPath: 'repairRequestsApi',
  baseQuery: fetchMainBaseQuery(''),
  endpoints: (builder) => ({
    getAllObjects: builder.query<TObject[], IGetAllObjectsPayload>({
      query: (params) => ({
        url: '/objects',
        params,
      }),
    }),
    getOneRequest: builder.query<TRequest, IGetOneRequestPayload>({
      query: ({ requestId }) => ({
        url: `/requests/${requestId}`,
      }),
    }),
    attachMedia: builder.mutation<TRequest, FormData>({
      query: (formData) => ({
        url: '/requests/set/commentAttachment',
        method: 'PATCH',
        body: formData,
      }),
    }),
    updateRequest: builder.mutation<void, IUpdateRequestPayload>({
      query: (body) => ({
        url: `/requests/${body.requestId}/update`,
        method: 'PATCH',
        body,
      }),
    }),
  }),
});

export const {
  useGetAllObjectsQuery,
  useLazyGetOneRequestQuery,
  useAttachMediaMutation,
  useUpdateRequestMutation,
} = repairRequestsApi;
