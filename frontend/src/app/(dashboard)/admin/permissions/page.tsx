'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import type { RootState } from '@/store';
import { setModulesFromApi, type CrudAction } from '@/store/slices/permissionsSlice';
import type { ApiRole } from '@/store/api/userApi';
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetRolesQuery,
  useGetUsersQuery,
  useUpdateRoleMutation,
} from '@/store/api/userApi';
import {
  useGetPermissionMatrixQuery,
  useTogglePermissionCrudMutation,
  useTogglePermissionRoleMutation,
} from '@/store/api/permissionsApi';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const roleSchema = z.object({
  name: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Use uppercase letters, numbers, and underscores only'),
  label: z.string().min(2, 'Display label is required'),
});

function getAccessLabel(hasView: boolean, crud: CrudAction[]): string {
  if (!hasView) return 'None';
  const has = (a: CrudAction) => crud.includes(a);
  if (has('create') && has('update') && has('delete')) return 'Full';
  if (has('create') || has('update') || has('delete')) return 'Partial';
  return 'View Only';
}

function getChipColor(label: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (label === 'Full') return 'success';
  if (label === 'Partial') return 'warning';
  if (label === 'View Only') return 'info';
  if (label === 'None') return 'error';
  return 'default';
}

export default function PermissionsManagementPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const fallbackModules = useSelector((state: RootState) => state.permissions.modules);

  const { data: matrixData, refetch: refetchMatrix } = useGetPermissionMatrixQuery();
  const { data: roles = [] } = useGetRolesQuery();
  const { data: usersData } = useGetUsersQuery({ page_size: 500 });

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [togglePermissionRole] = useTogglePermissionRoleMutation();
  const [togglePermissionCrud] = useTogglePermissionCrudMutation();

  const modules = matrixData?.data?.length ? matrixData.data : fallbackModules;
  const users = usersData?.data ?? [];

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', label: '' });
  const [roleErrors, setRoleErrors] = useState<{ name?: string; label?: string }>({});
  const [roleToDelete, setRoleToDelete] = useState<ApiRole | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Permission Management | SC-GIMS';
  }, []);

  useEffect(() => {
    if (matrixData?.data?.length) {
      dispatch(setModulesFromApi(matrixData.data));
    }
  }, [matrixData, dispatch]);

  const roleNames = roles.map((r) => r.name);
  const selectedRoleData = roles.find((r) => r.name === selectedRole);
  const isAdmin = selectedRole === 'SYSTEM_ADMIN';

  const handleViewToggle = async (moduleKey: string) => {
    if (!selectedRole || isAdmin) return;
    try {
      await togglePermissionRole({ moduleKey, roleName: selectedRole }).unwrap();
      refetchMatrix();
    } catch {
      setBlockedMessage('Failed to update permission.');
    }
  };

  const handleCrudToggle = async (moduleKey: string, action: CrudAction) => {
    if (!selectedRole || isAdmin) return;
    try {
      await togglePermissionCrud({ moduleKey, roleName: selectedRole, action }).unwrap();
      refetchMatrix();
    } catch {
      setBlockedMessage('Failed to update permission.');
    }
  };

  const handleGrantAll = async (moduleKey: string) => {
    if (!selectedRole || isAdmin) return;
    const mod = modules.find((m) => m.key === moduleKey);
    if (!mod) return;
    try {
      if (!mod.allowedRoles.includes(selectedRole)) {
        await togglePermissionRole({ moduleKey, roleName: selectedRole }).unwrap();
      }
      const crud = mod.crud[selectedRole] ?? [];
      for (const action of ['create', 'update', 'delete'] as CrudAction[]) {
        if (!crud.includes(action)) {
          await togglePermissionCrud({ moduleKey, roleName: selectedRole, action }).unwrap();
        }
      }
      refetchMatrix();
    } catch {
      setBlockedMessage('Failed to update permissions.');
    }
  };

  const handleRevokeAll = async (moduleKey: string) => {
    if (!selectedRole || isAdmin) return;
    const mod = modules.find((m) => m.key === moduleKey);
    if (!mod) return;
    if (mod.allowedRoles.includes(selectedRole)) {
      try {
        await togglePermissionRole({ moduleKey, roleName: selectedRole }).unwrap();
        refetchMatrix();
      } catch {
        setBlockedMessage('Failed to update permission.');
      }
    }
  };

  const handleAddRole = async () => {
    const trimmed = { name: roleForm.name.trim().toUpperCase(), label: roleForm.label.trim() };
    const errors: { name?: string; label?: string } = {};
    const parsed = roleSchema.safeParse(trimmed);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as 'name' | 'label';
        if (!errors[field]) errors[field] = issue.message;
      }
    }
    if (!errors.name && roleNames.includes(trimmed.name)) {
      errors.name = 'A role with this name already exists';
    }
    if (Object.keys(errors).length > 0) {
      setRoleErrors(errors);
      return;
    }
    try {
      await createRole({ name: trimmed.name, label: trimmed.label, is_active: true }).unwrap();
      setRoleForm({ name: '', label: '' });
      setRoleErrors({});
      setAddRoleOpen(false);
      setSelectedRole(trimmed.name);
    } catch {
      setBlockedMessage('Failed to create role.');
    }
  };

  const handleToggleActive = async (role: ApiRole) => {
    try {
      await updateRole({ id: role.id, data: { is_active: !role.is_active } }).unwrap();
    } catch {
      setBlockedMessage('Failed to update role status.');
    }
  };

  const requestDeleteRole = (role: ApiRole) => {
    const usersWithRole = users.filter((u) => u.role === role.name).length;
    if (usersWithRole > 0) {
      setBlockedMessage(
        `Cannot delete ${role.label} — ${usersWithRole} user(s) currently have this role. Reassign them first.`
      );
      return;
    }
    setBlockedMessage(null);
    setRoleToDelete(role);
  };

  const confirmDeleteRole = async () => {
    if (roleToDelete) {
      try {
        if (selectedRole === roleToDelete.name) setSelectedRole(null);
        await deleteRole(roleToDelete.id).unwrap();
      } catch {
        setBlockedMessage('Failed to delete role.');
      }
    }
    setRoleToDelete(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={() => router.push('/System_admin')}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h5" component="h1">
            Role Permission Management
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestartAltIcon />}
          onClick={() => setResetOpen(true)}
        >
          Reset to Defaults
        </Button>
      </Box>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">System Roles</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddRoleOpen(true)}
          >
            Add Role
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Select a role to view and edit its module permissions below.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {roles.map((role) => (
            <Box
              key={role.id}
              onClick={() => setSelectedRole(role.name)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                border: '1px solid',
                borderColor: selectedRole === role.name ? 'primary.main' : 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: selectedRole === role.name ? 'action.selected' : 'transparent',
                opacity: role.is_active ? 1 : 0.6,
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {role.is_system && <LockIcon fontSize="small" color="action" />}
                <Typography sx={{ fontWeight: selectedRole === role.name ? 700 : 500 }}>
                  {role.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({role.name})
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {role.name !== 'SYSTEM_ADMIN' && (
                  <Chip
                    label={role.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={role.is_active ? 'success' : 'default'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(role);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                )}
                {!role.is_system && (
                  <Button
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDeleteRole(role);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {selectedRole && selectedRoleData && (
        <Paper sx={{ p: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="h6">{selectedRoleData.label} — Module Permissions</Typography>
            {isAdmin && <Chip label="Full access (locked)" color="success" size="small" />}
          </Box>

          {isAdmin ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              System Administrator always has full access to every module. This cannot be changed.
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Toggle which modules this role can access and what actions they can perform. Changes
              take effect immediately.
            </Typography>
          )}

          <Divider sx={{ mb: 2 }} />

          {modules.map((mod) => {
            const hasView = mod.allowedRoles.includes(selectedRole);
            const crud = mod.crud[selectedRole] ?? [];
            const label = isAdmin ? 'Full' : getAccessLabel(hasView, crud);
            const chipColor = isAdmin ? 'success' : getChipColor(label);

            return (
              <Box
                key={mod.key}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: hasView || isAdmin ? 'transparent' : 'action.hover',
                }}
              >
                <Box sx={{ minWidth: 160 }}>
                  <Typography sx={{ fontWeight: 600 }}>{mod.label}</Typography>
                  <Chip
                    label={label}
                    size="small"
                    color={chipColor as 'success' | 'warning' | 'info' | 'error' | 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Checkbox
                      checked={isAdmin || hasView}
                      onChange={() => handleViewToggle(mod.key)}
                      disabled={isAdmin}
                      size="small"
                    />
                    <Typography variant="body2">View</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Checkbox
                      checked={isAdmin || crud.includes('create')}
                      onChange={() => handleCrudToggle(mod.key, 'create')}
                      disabled={isAdmin}
                      size="small"
                    />
                    <Typography variant="body2">Create</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Checkbox
                      checked={isAdmin || crud.includes('update')}
                      onChange={() => handleCrudToggle(mod.key, 'update')}
                      disabled={isAdmin}
                      size="small"
                    />
                    <Typography variant="body2">Update</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Checkbox
                      checked={isAdmin || crud.includes('delete')}
                      onChange={() => handleCrudToggle(mod.key, 'delete')}
                      disabled={isAdmin}
                      size="small"
                    />
                    <Typography variant="body2">Delete</Typography>
                  </Box>

                  {!isAdmin && (
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <Button size="small" onClick={() => handleGrantAll(mod.key)}>
                        All
                      </Button>
                      <Button size="small" color="error" onClick={() => handleRevokeAll(mod.key)}>
                        None
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Paper>
      )}

      {!selectedRole && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Select a role above to view and manage its permissions.
          </Typography>
        </Paper>
      )}

      <Dialog open={addRoleOpen} onClose={() => setAddRoleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Role</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Role name (machine name)"
              placeholder="e.g. FINANCE"
              fullWidth
              value={roleForm.name}
              error={!!roleErrors.name}
              helperText={
                roleErrors.name ?? 'Uppercase letters, numbers, underscores. e.g. FINANCE'
              }
              onChange={(e) => {
                setRoleForm({ ...roleForm, name: e.target.value.toUpperCase() });
                if (roleErrors.name) setRoleErrors({ ...roleErrors, name: undefined });
              }}
            />
            <TextField
              label="Display label"
              placeholder="e.g. Finance Officer"
              fullWidth
              value={roleForm.label}
              error={!!roleErrors.label}
              helperText={roleErrors.label}
              onChange={(e) => {
                setRoleForm({ ...roleForm, label: e.target.value });
                if (roleErrors.label) setRoleErrors({ ...roleErrors, label: undefined });
              }}
            />
            <Alert severity="info">
              The new role starts with no permissions. After creating it, grant access below, then
              add users with this role in User Management.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRoleOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddRole}>
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!roleToDelete} onClose={() => setRoleToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete the role <strong>{roleToDelete?.label}</strong> (
            {roleToDelete?.name})? This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setRoleToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDeleteRole}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Permissions</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Reloads the permission matrix from the API. To restore the seeded role matrix, run{' '}
            <code>python manage.py seed_permissions</code> on the backend.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                refetchMatrix();
                setResetOpen(false);
              }}
            >
              Reload from API
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}