import { baseApi } from './baseApi';
import type { ListParams, ListResponse } from './types';
import type { District, Province, Town } from '@/types/site';

export type CreateProvinceDto = { name: string; code: string };
export type UpdateProvinceDto = Partial<CreateProvinceDto>;
export type CreateDistrictDto = { name: string; code: string; province_id: string };
export type UpdateDistrictDto = Partial<CreateDistrictDto>;
export type CreateTownDto = { name: string; code: string; district_id: string };
export type UpdateTownDto = Partial<CreateTownDto>;

export const provinceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProvinces: builder.query<ListResponse<Province>, ListParams | void>({
      query: (params) => ({ url: '/api/v1/provinces/', params: params ?? {} }),
      providesTags: ['Province'],
    }),
    getProvince: builder.query<Province, string>({
      query: (id) => `/api/v1/provinces/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Province', id }],
    }),
    createProvince: builder.mutation<Province, CreateProvinceDto>({
      query: (body) => ({ url: '/api/v1/provinces/', method: 'POST', body }),
      invalidatesTags: ['Province'],
    }),
    updateProvince: builder.mutation<Province, { id: string; data: UpdateProvinceDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/provinces/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Province'],
    }),
    deleteProvince: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/provinces/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Province'],
    }),

    getDistricts: builder.query<
      ListResponse<District>,
      (ListParams & { province_id?: string }) | void
    >({
      query: (params) => ({ url: '/api/v1/districts/', params: params ?? {} }),
      providesTags: ['District'],
    }),
    getDistrict: builder.query<District, string>({
      query: (id) => `/api/v1/districts/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'District', id }],
    }),
    createDistrict: builder.mutation<District, CreateDistrictDto>({
      query: (body) => ({ url: '/api/v1/districts/', method: 'POST', body }),
      invalidatesTags: ['District'],
    }),
    updateDistrict: builder.mutation<District, { id: string; data: UpdateDistrictDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/districts/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['District'],
    }),
    deleteDistrict: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/districts/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['District'],
    }),

    getTowns: builder.query<
      ListResponse<Town>,
      (ListParams & { district_id?: string; province_id?: string }) | void
    >({
      query: (params) => ({ url: '/api/v1/towns/', params: params ?? {} }),
      providesTags: ['Town'],
    }),
    getTown: builder.query<Town, string>({
      query: (id) => `/api/v1/towns/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Town', id }],
    }),
    createTown: builder.mutation<Town, CreateTownDto>({
      query: (body) => ({ url: '/api/v1/towns/', method: 'POST', body }),
      invalidatesTags: ['Town'],
    }),
    updateTown: builder.mutation<Town, { id: string; data: UpdateTownDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/towns/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Town'],
    }),
    deleteTown: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/towns/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Town'],
    }),
  }),
});

export const {
  useGetProvincesQuery,
  useGetProvinceQuery,
  useCreateProvinceMutation,
  useUpdateProvinceMutation,
  useDeleteProvinceMutation,
  useGetDistrictsQuery,
  useGetDistrictQuery,
  useCreateDistrictMutation,
  useUpdateDistrictMutation,
  useDeleteDistrictMutation,
  useGetTownsQuery,
  useGetTownQuery,
  useCreateTownMutation,
  useUpdateTownMutation,
  useDeleteTownMutation,
} = provinceApi;
