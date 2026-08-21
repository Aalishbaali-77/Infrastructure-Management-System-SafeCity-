import { baseApi } from './baseApi';
import type { ListParams, ListResponse } from './types';
import type { Deviation, DeviationStatus, DeviationWrite } from '@/types/deviation';

interface DeviationListParams extends ListParams {
  site_id?: string;
  project_id?: string;
  status?: string;
  severity?: string;
  source?: string;
}

interface DeviationStats {
  total: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  by_source: Record<string, number>;
}

export const deviationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeviations: builder.query<ListResponse<Deviation>, DeviationListParams | void>({
      query: (params) => ({
        url: '/api/v1/execution-deviations/',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Deviation' as const, id })),
              { type: 'Deviation', id: 'LIST' },
            ]
          : [{ type: 'Deviation', id: 'LIST' }],
    }),
    getDeviationStats: builder.query<DeviationStats, DeviationListParams | void>({
      query: (params) => ({
        url: '/api/v1/execution-deviations/stats/',
        params: params ?? {},
      }),
      providesTags: [{ type: 'Deviation', id: 'STATS' }],
    }),
    getDeviation: builder.query<Deviation, string>({
      query: (id) => `/api/v1/execution-deviations/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Deviation', id }],
    }),
    createDeviation: builder.mutation<Deviation, DeviationWrite>({
      query: (body) => ({
        url: '/api/v1/execution-deviations/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Deviation', id: 'LIST' }, { type: 'Deviation', id: 'STATS' }],
    }),
    transitionDeviation: builder.mutation<Deviation, { id: string; status: DeviationStatus }>({
      query: ({ id, status }) => ({
        url: `/api/v1/execution-deviations/${id}/transition/`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Deviation', id },
        { type: 'Deviation', id: 'LIST' },
        { type: 'Deviation', id: 'STATS' },
      ],
    }),
    deleteDeviation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/execution-deviations/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Deviation', id: 'LIST' }, { type: 'Deviation', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetDeviationsQuery,
  useGetDeviationStatsQuery,
  useGetDeviationQuery,
  useCreateDeviationMutation,
  useTransitionDeviationMutation,
  useDeleteDeviationMutation,
} = deviationApi;