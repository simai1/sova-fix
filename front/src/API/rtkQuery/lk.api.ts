import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import withReauth from './withReauth';

import { API_URL } from '@/constants/env.constant';

export type LkUser = {
  id: string;
  login: string;
  name: string | null;
  role: string;
};

export type LkContractor = {
  id: string;
  name: string | null;
};

export type LkTelegram = {
  linked: boolean;
  username: string | null;
  tgId: string | null;
};

export type MeDto = {
  user: LkUser;
  contractor: LkContractor | null;
  objectIds: string[];
  telegram?: LkTelegram | null;
};

export type LkObject = {
  id: string;
  name: string;
  number?: number;
  city?: string;
  unit?: { id: string; name: string } | null;
};

export type LkUrgency = {
  id: string;
  name: string;
  number: number;
  color?: string;
};

export type LkStatus = {
  id: string;
  name: string;
  number: number;
  color?: string;
};

export type LkContractorRef = {
  id: string;
  name: string | null;
};

export type LkComment = {
  id?: string;
  text?: string;
  createdAt?: string;
  authorName?: string;
};

export type RequestDto = {
  id: string;
  number: number;
  problemDescription: string | null;
  urgency: LkUrgency | string | null;
  urgencyId: string | null;
  status: LkStatus | number;
  statusId: string | null;
  fileName: string | null;
  fileNames?: string[] | null;
  checkPhoto: string | null;
  comment: string | null;
  commentAttachment?: string | null;
  comments?: LkComment[];
  createdAt: string;
  completeDate: string | null;
  daysAtWork?: number;
  planCompleteDate?: string | null;
  exitDate?: string | null;
  contractorId: string | null;
  createdByUserId: string | null;
  objectId: string;
  Object?: LkObject | null;
  Unit?: { id: string; name: string } | null;
  Status?: LkStatus | null;
  Urgency?: LkUrgency | null;
  Contractor?: LkContractorRef | null;
  Category?: { id: string; name: string } | null;
  isAssigned?: boolean | null;
};

export type ListParams = {
  role: 'contractor' | 'customer';
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
  objectId?: string;
  statusId?: string;
  urgencyId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  mine?: boolean;
};

export type ListResponse = {
  items: RequestDto[];
  total: number;
  page: number;
  limit: number;
};

export type ChatMessageRole = 'MANAGER' | 'CONTRACTOR' | 'CUSTOMER' | 'ADMIN' | 'OTHER';

export type ChatMessage = {
  id: string;
  text: string;
  createdAt: string;
  attachment: string | null;
  fileName?: string | null;
  author: {
    id: string | null;
    name: string | null;
    role: number | null;
    roleName: ChatMessageRole;
  };
};

export type CommentsResponse = {
  items: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CommentsParams = {
  requestId: string;
  cursor?: string;
  limit?: number;
};

export type TgBindingInitResponse = {
  deepLink: string;
  expiresAt: string;
  botUsername?: string;
  token?: string;
};

export type LkSetting = {
  id: string;
  name: string;
  setting: string;
  value: boolean;
};

const lkBaseQuery = fetchBaseQuery({
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

export const lkApi = createApi({
  reducerPath: 'lkApi',
  baseQuery: withReauth(lkBaseQuery),
  tagTypes: ['LkRequest', 'LkMe', 'LkObject', 'LkRequestComments'],
  endpoints: (build) => ({
    getMe: build.query<MeDto, void>({
      query: () => '/lk/me',
      providesTags: ['LkMe'],
    }),

    getMyObjects: build.query<LkObject[], void>({
      query: () => '/lk/objects/my',
      providesTags: ['LkObject'],
    }),

    getMyRequests: build.query<ListResponse, ListParams>({
      query: (params) => {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            search.set(key, String(value));
          }
        });
        return `/lk/requests?${search.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'LkRequest' as const, id })),
              { type: 'LkRequest' as const, id: 'LIST' },
            ]
          : [{ type: 'LkRequest' as const, id: 'LIST' }],
    }),

    getMyRequest: build.query<RequestDto, string>({
      query: (id) => `/lk/requests/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'LkRequest', id }],
    }),

    createRequest: build.mutation<RequestDto, FormData>({
      query: (body) => ({
        url: '/lk/requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'LkRequest', id: 'LIST' }],
    }),

    addComment: build.mutation<ChatMessage, { id: string; text: string; file?: File }>({
      query: ({ id, text, file }) => {
        const fd = new FormData();
        fd.append('text', text);
        if (file) fd.append('file', file);
        return {
          url: `/lk/requests/${id}/comments`,
          method: 'POST',
          body: fd,
        };
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'LkRequest', id }],
    }),

    getRequestComments: build.query<CommentsResponse, CommentsParams>({
      query: ({ requestId, cursor, limit }) => {
        const search = new URLSearchParams();
        if (cursor) search.set('cursor', cursor);
        if (limit) search.set('limit', String(limit));
        const qs = search.toString();
        return `/lk/requests/${requestId}/comments${qs ? `?${qs}` : ''}`;
      },
      providesTags: (_r, _e, { requestId }) => [
        { type: 'LkRequestComments' as const, id: requestId },
      ],
    }),

    addPhotos: build.mutation<void, { id: string; files: File[] }>({
      query: ({ id, files }) => {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        return {
          url: `/lk/requests/${id}/photos`,
          method: 'POST',
          body: fd,
        };
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'LkRequest', id }],
    }),

    setStatus: build.mutation<void, { id: string; statusNumber: number }>({
      query: ({ id, statusNumber }) => ({
        url: `/lk/requests/${id}/status`,
        method: 'PATCH',
        body: { statusNumber },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'LkRequest', id },
        { type: 'LkRequest', id: 'LIST' },
      ],
    }),

    uploadCheckPhoto: build.mutation<void, { id: string; file: File }>({
      query: ({ id, file }) => {
        const fd = new FormData();
        fd.append('file', file);
        return {
          url: `/lk/requests/${id}/check-photo`,
          method: 'POST',
          body: fd,
        };
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'LkRequest', id }],
    }),

    updateExitDate: build.mutation<void, { id: string; exitDate: string | null }>({
      query: ({ id, exitDate }) => ({
        url: `/lk/requests/${id}/exit-date`,
        method: 'PATCH',
        body: { exitDate },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'LkRequest', id },
        { type: 'LkRequest', id: 'LIST' },
      ],
    }),

    getStatuses: build.query<LkStatus[], void>({
      query: () => '/status',
    }),

    getUrgencies: build.query<LkUrgency[], void>({
      query: () => '/urgency',
    }),

    initTgBinding: build.mutation<TgBindingInitResponse, void>({
      query: () => ({
        url: '/lk/me/tg-binding/init',
        method: 'POST',
        body: {},
      }),
    }),

    unlinkTelegram: build.mutation<void, void>({
      query: () => ({
        url: '/lk/me/tg-binding',
        method: 'DELETE',
      }),
      invalidatesTags: ['LkMe'],
    }),

    getSettingByName: build.query<LkSetting, string>({
      query: (name) => `/settings/${name}`,
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetMyObjectsQuery,
  useGetMyRequestsQuery,
  useGetMyRequestQuery,
  useCreateRequestMutation,
  useAddCommentMutation,
  useGetRequestCommentsQuery,
  useAddPhotosMutation,
  useSetStatusMutation,
  useUploadCheckPhotoMutation,
  useUpdateExitDateMutation,
  useGetStatusesQuery,
  useGetUrgenciesQuery,
  useInitTgBindingMutation,
  useUnlinkTelegramMutation,
  useGetSettingByNameQuery,
} = lkApi;
