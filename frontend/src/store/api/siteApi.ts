import { baseApi } from './baseApi';
import type { ListParams, ListResponse } from './types';
import type { CreateSiteDto, Site, UpdateSiteDto } from '@/types/site';

export const sitesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSites: builder.query<
      ListResponse<Site>,
      (ListParams & { project_id?: string; town_id?: string; status?: string }) | void
    >({
      query: (params) => ({
        url: '/api/v1/sites/',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Site' as const, id })),
              { type: 'Site', id: 'LIST' },
            ]
          : [{ type: 'Site', id: 'LIST' }],
    }),
    getSite: builder.query<Site, string>({
      query: (id) => `/api/v1/sites/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Site', id }],
    }),
    createSite: builder.mutation<Site, CreateSiteDto>({
      query: (body) => ({
        url: '/api/v1/sites/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Site', id: 'LIST' }],
    }),
    updateSite: builder.mutation<Site, { id: string; data: UpdateSiteDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/sites/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Site', id },
        { type: 'Site', id: 'LIST' },
      ],
    }),
    deleteSite: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/sites/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Site', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSitesQuery,
  useGetSiteQuery,
  useCreateSiteMutation,
  useUpdateSiteMutation,
  useDeleteSiteMutation,
} = sitesApi;
