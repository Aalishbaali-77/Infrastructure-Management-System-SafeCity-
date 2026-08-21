import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { tokenService } from '@/services/tokenService';
import { authService } from '@/services/authService';
import { logout, setAccessToken } from '../slices/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  prepareHeaders: (headers, { getState }) => {
    const stateToken = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
    const token = stateToken || tokenService.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refresh = tokenService.getRefreshToken();
    if (!refresh) {
      api.dispatch(logout());
      return result;
    }
    try {
      const tokens = await authService.refresh(refresh);
      tokenService.setAccessToken(tokens.accessToken);
      tokenService.setRefreshToken(tokens.refreshToken);
      api.dispatch(setAccessToken(tokens.accessToken));
      result = await rawBaseQuery(args, api, extraOptions);
    } catch {
      tokenService.clear();
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Project',
    'Site',
    'Boq',
    'BoqItem',
    'Permission',
    'Province',
    'District',
    'Town',
    'City',
    'User',
    'Role',
    'DailyProgress',
    'ProgressTaskTemplate',
    'SiteProgressTask',
    'Deviation',
    'Workflow',
  ],
  endpoints: () => ({}),
});
