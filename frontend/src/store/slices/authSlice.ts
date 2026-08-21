import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { tokenService } from '@/services/tokenService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  provinceIds?: string[];
  siteIds?: string[];
  contractorId?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loginError: string | null;
  bootstrapped: boolean;
}

const cachedUser = typeof window !== 'undefined' ? tokenService.getCachedUser<AuthUser>() : null;
const hasRefresh = typeof window !== 'undefined' ? !!tokenService.getRefreshToken() : false;

const initialState: AuthState = {
  user: cachedUser,
  accessToken: null,
  isAuthenticated: !!(cachedUser && hasRefresh),
  loginError: null,
  bootstrapped: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.loginError = null;
      state.bootstrapped = true;
      tokenService.setAccessToken(action.payload.accessToken);
      tokenService.setRefreshToken(action.payload.refreshToken);
      tokenService.setCachedUser(action.payload.user);
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      tokenService.setAccessToken(action.payload);
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      tokenService.setCachedUser(action.payload);
    },
    setBootstrapped: (state) => {
      state.bootstrapped = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loginError = null;
      state.bootstrapped = true;
      tokenService.clear();
    },
    setLoginError: (state, action: PayloadAction<string>) => {
      state.loginError = action.payload;
    },
    clearLoginError: (state) => {
      state.loginError = null;
    },
  },
});

export const {
  setCredentials,
  setAccessToken,
  setUser,
  setBootstrapped,
  logout,
  setLoginError,
  clearLoginError,
} = authSlice.actions;
export default authSlice.reducer;
