/**
 * In-memory access token + sessionStorage refresh token.
 * Does not use localStorage.
 */

let accessToken: string | null = null;

const REFRESH_KEY = 'sc_gims_refresh';
const USER_KEY = 'sc_gims_user';

export const tokenService = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string | null): void {
    accessToken = token;
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(REFRESH_KEY);
  },

  setRefreshToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) sessionStorage.setItem(REFRESH_KEY, token);
    else sessionStorage.removeItem(REFRESH_KEY);
  },

  getCachedUser<T>(): T | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setCachedUser(user: unknown | null): void {
    if (typeof window === 'undefined') return;
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
  },

  clear(): void {
    accessToken = null;
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};
