import { baseApi } from './baseApi';
import type { ModulePermission, CrudAction } from '../slices/permissionsSlice';

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissionMatrix: builder.query<{ data: ModulePermission[] }, void>({
      query: () => '/api/v1/permissions/',
      providesTags: ['Permission'],
    }),
    togglePermissionRole: builder.mutation<
      { data: ModulePermission[] },
      { moduleKey: string; roleName: string }
    >({
      query: ({ moduleKey, roleName }) => {
        const key = moduleKey.replace(/^\//, '');
        return {
          url: `/api/v1/permissions/${key}/role/${roleName}/`,
          method: 'PATCH',
        };
      },
      invalidatesTags: ['Permission'],
    }),
    togglePermissionCrud: builder.mutation<
      { data: ModulePermission[] },
      { moduleKey: string; roleName: string; action: CrudAction }
    >({
      query: ({ moduleKey, roleName, action }) => {
        const key = moduleKey.replace(/^\//, '');
        return {
          url: `/api/v1/permissions/${key}/role/${roleName}/crud/`,
          method: 'PATCH',
          body: { action },
        };
      },
      invalidatesTags: ['Permission'],
    }),
  }),
});

export const {
  useGetPermissionMatrixQuery,
  useTogglePermissionRoleMutation,
  useTogglePermissionCrudMutation,
} = permissionsApi;
