import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
  // Поля, добавленные при выравнивании ЛК с админ-таблицей.
  // Все опционально-nullable — старые заявки могут быть без значения.
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
  // true — заявка назначена текущему пользователю-исполнителю.
  // null — поле не было вычислено (legacy/админ-вызовы).
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
};

export type ListResponse = {
  items: RequestDto[];
  total: number;
  page: number;
  limit: number;
};

// Сообщение в чате заявки. Расширение LkComment под полноценный чат:
// автор + роль (для роль-чипов), createdAt, опциональный attachment.
// Поле fileName сохраняем для совместимости с возможным legacy-форматом.
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
  baseQuery: lkBaseQuery,
  // LkRequestComments — отдельный тег для пагинации чата по requestId.
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

    addComment: build.mutation<ChatMessage | void, { id: string; text: string; file?: File }>({
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
      // Инвалидируем и саму заявку (для preview last comment), и страницы чата.
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'LkRequest', id },
        { type: 'LkRequestComments', id },
      ],
    }),

    // Cursor-пагинация чата. Каждый ответ — отдельная страница; фронт
    // склеивает их в стейте компонента (как RequestsList с offset-пагинацией).
    getRequestComments: build.query<CommentsResponse, CommentsParams>({
      query: ({ requestId, cursor, limit }) => {
        const search = new URLSearchParams();
        if (cursor) search.set('cursor', cursor);
        if (limit) search.set('limit', String(limit));
        const qs = search.toString();
        return `/lk/requests/${requestId}/comments${qs ? `?${qs}` : ''}`;
      },
      // Тег по requestId — на addComment / ws COMMENT_CREATE инвалидируется
      // вся история чата этой заявки. Не идеально (перезагружает все
      // подгруженные страницы), но MVP-достаточно.
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

    // Фиксация даты выезда исполнителем. exitDate — ISO либо null (сброс).
    // Бэкенд: PATCH /lk/requests/:id/exit-date (только assigned-исполнитель/admin).
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

    // Привязка Telegram через deep-link бота. Сервер возвращает одноразовый
    // короткоживущий токен в виде ссылки t.me/<bot>?start=link_<token>.
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
} = lkApi;
