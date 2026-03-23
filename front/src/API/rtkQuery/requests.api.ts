import { createApi } from '@reduxjs/toolkit/query/react';

import {
  CreateRequestWithoutPhotoPayload,
  IGetAllObjectsPayload,
  IGetOneRequestPayload,
  IGetRequestCountResponse,
  IUpdateRequestPayload,
} from './types/requests.types';
import fetchMainBaseQuery from '../../store/rtkquery';
import { TObject, TUnit } from '../../types/object.types';
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
    getRequestCount: builder.query<IGetRequestCountResponse, void>({
      query: () => ({
        url: '/requests/count',
      }),
    }),
    createRequestWithMultyPhoto: builder.mutation<void, FormData>({
      query: (body) => ({
        url: '/requests/multiple-photos',
        method: 'POST',
        body,
      }),
    }),
    createRequestSinglePhoto: builder.mutation<void, FormData>({
      query: (body) => ({
        url: '/requests',
        method: 'POST',
        body,
      }),
    }),
    createRequestWithoutPhoto: builder.mutation<void, CreateRequestWithoutPhotoPayload>({
      query: (body) => ({
        url: '/requests/without-photo',
        method: 'POST',
        body,
      }),
    }),
    getAllUnits: builder.query<TUnit[], void>({
      query: () => ({
        url: '/units',
      }),
    }),
  }),
});

export const {
  useGetAllObjectsQuery,
  useLazyGetAllObjectsQuery,
  useLazyGetOneRequestQuery,
  useAttachMediaMutation,
  useUpdateRequestMutation,
  useGetRequestCountQuery,
  useCreateRequestWithMultyPhotoMutation,
  useGetAllUnitsQuery,
  useCreateRequestSinglePhotoMutation,
  useCreateRequestWithoutPhotoMutation,
} = repairRequestsApi;
