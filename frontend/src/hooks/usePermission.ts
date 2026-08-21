import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export function usePermission() {
  const user = useSelector((state: RootState) => state.auth.user);
  const roles = user?.roles ?? [];
  const provinceIds = user?.provinceIds ?? [];
  const siteIds = user?.siteIds ?? [];

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (allowedRoles: string[]) => allowedRoles.some((role) => roles.includes(role));

  return { roles, provinceIds, siteIds, hasRole, hasAnyRole };
}
