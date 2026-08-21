import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { CrudAction } from '@/store/slices/permissionsSlice';

export interface CrudPermission {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Checks what the logged-in user's role can do in a given module,
 * based on the live permission matrix set by System Admin.
 *
 * @param moduleKey - matches a module's `key` in permissionsSlice, e.g. '/sites'
 */
export function useCrudPermission(moduleKey: string): CrudPermission {
  const roles = useSelector((state: RootState) => state.auth.user?.roles ?? []);
  const modules = useSelector((state: RootState) => state.permissions.modules);

  const mod = modules.find((m) => m.key === moduleKey);

  if (!mod) {
    return { canView: false, canCreate: false, canUpdate: false, canDelete: false };
  }

  // SYSTEM_ADMIN always has full access, matching the safety rule
  // already used on the Permission Management page.
  if (roles.includes('SYSTEM_ADMIN')) {
    return { canView: true, canCreate: true, canUpdate: true, canDelete: true };
  }

  const matchedRole = roles.find((r) => mod.allowedRoles.includes(r));
  if (!matchedRole) {
    return { canView: false, canCreate: false, canUpdate: false, canDelete: false };
  }

  const crud: CrudAction[] = mod.crud[matchedRole] ?? [];

  return {
    canView: true,
    canCreate: crud.includes('create'),
    canUpdate: crud.includes('update'),
    canDelete: crud.includes('delete'),
  };
}
