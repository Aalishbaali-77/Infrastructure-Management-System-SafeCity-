import { baseApi } from './baseApi';
import type { ListParams, ListResponse } from './types';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role: string;
  province_ids: string[];
  site_ids: string[];
  project_ids: string[];
  contractor_id: string | null;
  created_at: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active?: boolean;
  province_ids?: string[];
  site_ids?: string[];
  project_ids?: string[];
}

export type UpdateUserDto = Partial<CreateUserDto>;

export interface ApiRole {
  id: string;
  name: string;
  label: string;
  is_system: boolean;
  is_active: boolean;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<
      ListResponse<ApiUser>,
      (ListParams & { role?: string; is_active?: string }) | void
    >({
      query: (params) => ({ url: '/auth/users/', params: params ?? {} }),
      providesTags: ['User'],
    }),
    getUser: builder.query<ApiUser, string>({
      query: (id) => `/auth/users/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<ApiUser, CreateUserDto>({
      query: (body) => ({ url: '/auth/users/', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<ApiUser, { id: string; data: UpdateUserDto }>({
      query: ({ id, data }) => ({
        url: `/auth/users/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/auth/users/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
    toggleUserActive: builder.mutation<ApiUser, string>({
      query: (id) => ({
        url: `/auth/users/${id}/toggle_active/`,
        method: 'PATCH',
      }),
      invalidatesTags: ['User'],
    }),
    getRoles: builder.query<ApiRole[], void>({
      query: () => ({ url: '/auth/roles/', params: { page_size: 100 } }),
      transformResponse: (response: ApiRole[] | ListResponse<ApiRole>) => {
        if (Array.isArray(response)) return response;
        return response?.data ?? [];
      },
      providesTags: ['Role'],
    }),
    createRole: builder.mutation<ApiRole, { name: string; label: string; is_active?: boolean }>({
      query: (body) => ({ url: '/auth/roles/', method: 'POST', body }),
      invalidatesTags: ['Role', 'Permission'],
    }),
    updateRole: builder.mutation<
      ApiRole,
      { id: string; data: Partial<{ name: string; label: string; is_active: boolean }> }
    >({
      query: ({ id, data }) => ({
        url: `/auth/roles/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Role', 'Permission'],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({ url: `/auth/roles/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Role', 'Permission'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserActiveMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = userApi;
