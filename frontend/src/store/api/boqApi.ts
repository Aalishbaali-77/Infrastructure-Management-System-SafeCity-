import { baseApi } from './baseApi';
import type { BOQ, BOQItem, BOQItemWrite, BOQWrite } from '@/types/boq';

interface CursorPagination {
  next_cursor: string | null;
  previous_cursor: string | null;
  page_size: number;
  has_more: boolean;
}

interface ListResponse<T> {
  data: T[];
  pagination: CursorPagination;
}

interface BoqListParams {
  cursor?: string;
  page_size?: number;
  project_id?: string;
  status?: string;
}

/** @deprecated Prefer `BOQWrite` from `@/types/boq`. */
export type CreateBoqDto = BOQWrite;

/** @deprecated Prefer `BOQItemWrite` from `@/types/boq`. */
export type BoqItemWriteDto = BOQItemWrite;

export const boqApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBoqs: builder.query<ListResponse<BOQ>, BoqListParams | void>({
      query: (params) => ({
        url: '/api/v1/boq/',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Boq' as const, id })),
              { type: 'Boq', id: 'LIST' },
            ]
          : [{ type: 'Boq', id: 'LIST' }],
    }),
    getBoq: builder.query<BOQ, string>({
      query: (id) => `/api/v1/boq/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Boq', id }],
    }),
    createBoq: builder.mutation<BOQ, BOQWrite>({
      query: (body) => ({
        url: '/api/v1/boq/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Boq', id: 'LIST' }],
    }),
    updateBoq: builder.mutation<BOQ, { id: string; data: Partial<BOQWrite> }>({
      query: ({ id, data }) => ({
        url: `/api/v1/boq/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Boq', id },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
    deleteBoq: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/boq/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Boq', id: 'LIST' }],
    }),
    getBoqItems: builder.query<{ data: BOQItem[] }, string>({
      query: (boqId) => `/api/v1/boq/${boqId}/items/`,
      providesTags: (_r, _e, boqId) => [{ type: 'BoqItem', id: boqId }],
    }),
    createBoqItem: builder.mutation<BOQItem, { boqId: string; data: BOQItemWrite }>({
      query: ({ boqId, data }) => ({
        url: `/api/v1/boq/${boqId}/items/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_r, _e, { boqId }) => [
        { type: 'BoqItem', id: boqId },
        { type: 'Boq', id: boqId },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
    bulkReplaceBoqItems: builder.mutation<
      { data: BOQItem[] },
      { boqId: string; items: BOQItemWrite[] }
    >({
      query: ({ boqId, items }) => ({
        url: `/api/v1/boq/${boqId}/items/bulk/`,
        method: 'POST',
        body: items,
      }),
      invalidatesTags: (_r, _e, { boqId }) => [
        { type: 'BoqItem', id: boqId },
        { type: 'Boq', id: boqId },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
    updateBoqItem: builder.mutation<
      BOQItem,
      { id: string; boqId: string; data: Partial<BOQItemWrite> }
    >({
      query: ({ id, data }) => ({
        url: `/api/v1/boq-items/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { boqId }) => [
        { type: 'BoqItem', id: boqId },
        { type: 'Boq', id: boqId },
      ],
    }),
    deleteBoqItem: builder.mutation<void, { id: string; boqId: string }>({
      query: ({ id }) => ({
        url: `/api/v1/boq-items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { boqId }) => [
        { type: 'BoqItem', id: boqId },
        { type: 'Boq', id: boqId },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
    publishBoq: builder.mutation<BOQ, string>({
      query: (id) => ({
        url: `/api/v1/boq/${id}/publish/`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Boq', id },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
    markBoqReady: builder.mutation<BOQ, string>({
      query: (id) => ({
        url: `/api/v1/boq/${id}/mark-ready/`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Boq', id },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetBoqsQuery,
  useGetBoqQuery,
  useCreateBoqMutation,
  useUpdateBoqMutation,
  useDeleteBoqMutation,
  useGetBoqItemsQuery,
  useCreateBoqItemMutation,
  useBulkReplaceBoqItemsMutation,
  useUpdateBoqItemMutation,
  useDeleteBoqItemMutation,
  usePublishBoqMutation,
  useMarkBoqReadyMutation,
} = boqApi;
