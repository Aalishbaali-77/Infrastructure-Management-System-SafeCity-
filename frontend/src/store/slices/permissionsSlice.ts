import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CrudAction = 'create' | 'update' | 'delete';

export interface ModulePermission {
  key: string;
  label: string;
  allowedRoles: string[];
  crud: Record<string, CrudAction[]>;
}

const ALL_CRUD: CrudAction[] = ['create', 'update', 'delete'];

function fullCrud(roles: string[]): Record<string, CrudAction[]> {
  return roles.reduce<Record<string, CrudAction[]>>((acc, role) => {
    acc[role] = [...ALL_CRUD];
    return acc;
  }, {});
}

const defaultPermissions: ModulePermission[] = [
  (() => {
    const roles = ['EXEC', 'HOD', 'DIR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/projects', label: 'Projects', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['EXEC', 'HOD', 'DIR', 'SITE_ENG', 'CONTRACTOR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/sites', label: 'Sites', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['HOD', 'DIR', 'SITE_ENG', 'CONTRACTOR', 'QA', 'SYSTEM_ADMIN', 'AUDITOR'];
    return {
      key: '/work-packages',
      label: 'Work Packages',
      allowedRoles: roles,
      crud: fullCrud(roles),
    };
  })(),

  (() => {
    const roles = ['EXEC', 'HOD', 'DIR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/boq', label: 'BOQ', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['SITE_ENG', 'CONTRACTOR', 'HOD', 'DIR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return {
      key: '/daily-progress',
      label: 'Daily Progress',
      allowedRoles: roles,
      crud: fullCrud(roles),
    };
  })(),
  (() => {
    const roles = ['EXEC', 'HOD', 'DIR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/workflows', label: 'Workflows', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['EXEC', 'HOD', 'DIR', 'SITE_ENG', 'CONTRACTOR', 'QA', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/deviations', label: 'Deviations', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['SITE_ENG', 'CONTRACTOR', 'HOD', 'DIR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/tasks', label: 'Tasks', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['HOD', 'SITE_ENG', 'QA', 'SYSTEM_ADMIN', 'AUDITOR'];
    return {
      key: '/acceptance-tests',
      label: 'T&C Tests',
      allowedRoles: roles,
      crud: fullCrud(roles),
    };
  })(),
  (() => {
    const roles = ['HOD', 'SITE_ENG', 'QA', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/snag-list', label: 'Snag List', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['EXEC', 'HOD', 'SITE_ENG', 'CONTRACTOR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/field-logs', label: 'Field Logs', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['HOD', 'DIR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return {
      key: '/variation-orders',
      label: 'Variation Orders',
      allowedRoles: roles,
      crud: fullCrud(roles),
    };
  })(),
  (() => {
    const roles = ['HOD', 'DIR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/ipc', label: 'IPC', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['HOD', 'SITE_ENG', 'CONTRACTOR', 'QA', 'SYSTEM_ADMIN', 'AUDITOR'];
    return { key: '/inventory', label: 'Inventory', allowedRoles: roles, crud: fullCrud(roles) };
  })(),
  (() => {
    const roles = ['HOD', 'DIR', 'SYSTEM_ADMIN', 'AUDITOR'];
    return {
      key: '/fac-readiness',
      label: 'FAC Readiness',
      allowedRoles: roles,
      crud: fullCrud(roles),
    };
  })(),
];

interface PermissionsState {
  modules: ModulePermission[];
}

const initialState: PermissionsState = {
  modules: defaultPermissions,
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    toggleRoleForModule: (state, action: PayloadAction<{ moduleKey: string; role: string }>) => {
      const mod = state.modules.find((m) => m.key === action.payload.moduleKey);
      if (!mod) return;
      const { role } = action.payload;
      if (mod.allowedRoles.includes(role)) {
        mod.allowedRoles = mod.allowedRoles.filter((r) => r !== role);
        delete mod.crud[role];
      } else {
        mod.allowedRoles.push(role);
        mod.crud[role] = [...ALL_CRUD];
      }
    },
    toggleCrudForRole: (
      state,
      action: PayloadAction<{ moduleKey: string; role: string; crudAction: CrudAction }>
    ) => {
      const mod = state.modules.find((m) => m.key === action.payload.moduleKey);
      if (!mod) return;
      const { role, crudAction } = action.payload;
      if (!mod.allowedRoles.includes(role)) return;
      const current = mod.crud[role] ?? [];
      mod.crud[role] = current.includes(crudAction)
        ? current.filter((a) => a !== crudAction)
        : [...current, crudAction];
    },
    resetToDefaults: (state) => {
      state.modules = defaultPermissions;
    },
    setModulesFromApi: (state, action: PayloadAction<ModulePermission[]>) => {
      if (action.payload?.length) {
        state.modules = action.payload;
      }
    },
  },
});

export const { toggleRoleForModule, toggleCrudForRole, resetToDefaults, setModulesFromApi } =
  permissionsSlice.actions;
export default permissionsSlice.reducer;
