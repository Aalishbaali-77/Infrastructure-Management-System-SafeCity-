import type { AuthUser } from '@/store/slices/authSlice';
import { tokenService } from './tokenService';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  province_ids: string[];
  site_ids: string[];
  project_ids: string[];
  contractor_id: string | null;
  is_active: boolean;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: ApiUser;
}

function mapUser(user: ApiUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: [user.role],
    provinceIds: user.province_ids?.map(String) ?? [],
    siteIds: user.site_ids?.map(String) ?? [],
    contractorId: user.contractor_id,
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const detail = body.detail ?? body.message;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') {
      if (typeof detail.detail === 'string') return detail.detail;
      return JSON.stringify(detail);
    }
    return res.statusText || 'Request failed';
  } catch {
    return res.statusText || 'Request failed';
  }
}

export const authService = {
  mapUser,

  async login(
    email: string,
    password: string
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const res = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await parseError(res));
    const data: LoginResponse = await res.json();
    return {
      user: mapUser(data.user),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await fetch(`${API_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) throw new Error(await parseError(res));
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  },

  async logout(refreshToken: string | null): Promise<void> {
    if (!refreshToken) return;
    try {
      await fetch(`${API_URL}/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // best-effort blacklist
    }
  },

  async me(accessToken: string): Promise<AuthUser> {
    const res = await fetch(`${API_URL}/auth/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(await parseError(res));
    const data: ApiUser = await res.json();
    return mapUser(data);
  },

  hydrateFromSession(): { user: AuthUser; accessToken: null } | null {
    const user = tokenService.getCachedUser<AuthUser>();
    if (!user || !tokenService.getRefreshToken()) return null;
    return { user, accessToken: null };
  },
};
