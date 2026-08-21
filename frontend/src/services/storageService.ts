/**
 * @deprecated Prefer tokenService. Kept as a no-op shim so legacy imports do not use localStorage.
 */
export const storageService = {
  getRefreshToken(): string | null {
    return null;
  },
  setRefreshToken(_token: string): void {},
  clearRefreshToken(): void {},
  getSession(): null {
    return null;
  },
  setSession(_session: { user: unknown; accessToken: string }): void {},
  clearSession(): void {},
};
