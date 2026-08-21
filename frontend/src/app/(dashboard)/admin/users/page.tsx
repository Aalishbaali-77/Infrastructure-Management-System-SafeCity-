'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { z } from 'zod';
import type { RootState } from '@/store';
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetUsersQuery,
  useToggleUserActiveMutation,
  useUpdateUserMutation,
  type ApiUser,
} from '@/store/api/userApi';
import {
  useGetProvincesQuery,
  useGetDistrictsQuery,
  useGetTownsQuery,
} from '@/store/api/provinceApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetSitesQuery } from '@/store/api/siteApi';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import type { Role } from '@/types/user';

const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional(),
});

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'SITE_ENG' as Role,
  province_ids: [] as string[],
  site_ids: [] as string[],
  project_ids: [] as string[],
};

const emptyAdminForm = { name: '', email: '', phone: '' };

type FieldErrors = { name?: string; email?: string };

type DrilldownContext =
  | { type: 'province'; provinceId: string }
  | { type: 'kpi'; kpi: 'total' | 'active' | 'inactive' }
  | null;

export default function UserManagementPage() {
  const router = useRouter();
  const { data: usersData, refetch } = useGetUsersQuery({ page_size: 500 });
  const { data: provincesData } = useGetProvincesQuery({ page_size: 100 });
  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });
  const { data: sitesData } = useGetSitesQuery({ page_size: 500 });
  const { data: townsData } = useGetTownsQuery({ page_size: 500 });
  const { data: districtsData } = useGetDistrictsQuery({ page_size: 500 });
  const { data: rolesList = [] } = useGetRolesQuery();

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [toggleUserActive] = useToggleUserActiveMutation();

  const users = usersData?.data ?? [];
  const provinces = provincesData?.data ?? [];
  const projects = projectsData?.data ?? [];
  const sites = sitesData?.data ?? [];
  const towns = townsData?.data ?? [];
  const districts = districtsData?.data ?? [];
  const currentUserEmail = useSelector((state: RootState) => state.auth.user?.email);
  const ALL_ROLES = rolesList.map((r) => r.name);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  const [viewingUser, setViewingUser] = useState<ApiUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [userToToggle, setUserToToggle] = useState<ApiUser | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [adminErrors, setAdminErrors] = useState<FieldErrors>({});

  const [drilldown, setDrilldown] = useState<DrilldownContext>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    document.title = 'User Management | SC-GIMS';
  }, []);

  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = users.length - activeUsers;
  const systemAdmins = users.filter((u) => u.role === 'SYSTEM_ADMIN');
  const nonAdminUsers = users.filter((u) => u.role !== 'SYSTEM_ADMIN');

  const usersByProvince = (provinceId: string) =>
    nonAdminUsers.filter((u) => u.province_ids.includes(provinceId));

  const provinceName = (id: string) => provinces.find((p) => p.id === id)?.name ?? id;

  const userTowns = (user: ApiUser) => {
    const townNames = user.site_ids
      .map((siteId) => {
        const site = sites.find((s) => s.id === siteId);
        if (!site) return undefined;
        return site.town_name ?? towns.find((t) => t.id === site.town_id)?.name;
      })
      .filter((name): name is string => !!name);
    return Array.from(new Set(townNames));
  };

  const userProjects = (user: ApiUser) =>
    user.project_ids
      .map((id) => projects.find((p) => p.id === id)?.name)
      .filter((name): name is string => !!name);

  const isSelf = (user: ApiUser) =>
    !!currentUserEmail && user.email.toLowerCase() === currentUserEmail.toLowerCase();

  const emailTaken = (email: string, ignoreId: string | null) =>
    users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== ignoreId);

  const validateForm = (
    data: { name: string; email: string; phone?: string },
    ignoreId: string | null
  ): FieldErrors => {
    const errors: FieldErrors = {};
    const parsed = userFormSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      }
    }
    if (!errors.email && emailTaken(data.email, ignoreId)) {
      errors.email = 'A user with this email already exists';
    }
    return errors;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setOpen(true);
  };
  const openCreateInProvince = (provinceId: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, province_ids: [provinceId] });
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (user: ApiUser) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      province_ids: user.province_ids,
      site_ids: user.site_ids,
      project_ids: user.project_ids,
    });
    setFormErrors({});
    setOpen(true);
  };

  const handleSave = async () => {
    const errors = validateForm(form, editingId);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      if (editingId) {
        await updateUser({
          id: editingId,
          data: {
            name: form.name,
            email: form.email.trim(),
            phone: form.phone,
            role: form.role,
            province_ids: form.province_ids,
            site_ids: form.site_ids,
            project_ids: form.project_ids,
          },
        }).unwrap();
      } else {
        await createUser({
          name: form.name,
          email: form.email.trim(),
          phone: form.phone,
          role: form.role,
          is_active: true,
          province_ids: form.province_ids,
          site_ids: form.site_ids,
          project_ids: form.project_ids,
        }).unwrap();
      }
      setOpen(false);
      refetch();
    } catch {
      setBlockedMessage('Failed to save user. Please try again.');
    }
  };

  const handleAddAdmin = async () => {
    const errors = validateForm(adminForm, null);
    if (Object.keys(errors).length > 0) {
      setAdminErrors(errors);
      return;
    }
    try {
      await createUser({
        name: adminForm.name,
        email: adminForm.email.trim(),
        phone: adminForm.phone,
        role: 'SYSTEM_ADMIN',
        is_active: true,
      }).unwrap();
      setAdminForm(emptyAdminForm);
      setAdminErrors({});
      setAdminOpen(false);
      refetch();
    } catch {
      setBlockedMessage('Failed to create admin. Please try again.');
    }
  };

  const requestDelete = (user: ApiUser) => {
    if (isSelf(user)) {
      setBlockedMessage('You cannot delete your own account while logged in.');
      return;
    }
    if (user.role === 'SYSTEM_ADMIN' && systemAdmins.length <= 1) {
      setBlockedMessage('Cannot delete the last System Administrator account.');
      return;
    }
    setBlockedMessage(null);
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id).unwrap();
        refetch();
      } catch {
        setBlockedMessage('Failed to delete user.');
      }
    }
    setUserToDelete(null);
  };

  const requestToggle = (user: ApiUser) => {
    if (user.is_active && isSelf(user)) {
      setBlockedMessage('You cannot deactivate your own account while logged in.');
      return;
    }
    setBlockedMessage(null);
    if (user.is_active) {
      // Deactivation is disruptive — confirm first. Reactivation is safe, do it directly.
      setUserToToggle(user);
    } else {
      toggleUserActive(user.id)
        .unwrap()
        .then(() => refetch())
        .catch(() => setBlockedMessage('Failed to update user status.'));
    }
  };

  const confirmToggle = async () => {
    if (userToToggle) {
      try {
        await toggleUserActive(userToToggle.id).unwrap();
        refetch();
      } catch {
        setBlockedMessage('Failed to deactivate user.');
      }
    }
    setUserToToggle(null);
  };

  const { drilldownUsers, drilldownTitle } = useMemo(() => {
    if (!drilldown) return { drilldownUsers: [] as ApiUser[], drilldownTitle: '' };

    if (drilldown.type === 'province') {
      return {
        drilldownUsers: usersByProvince(drilldown.provinceId),
        drilldownTitle: provinceName(drilldown.provinceId),
      };
    }
    if (drilldown.kpi === 'total') {
      return { drilldownUsers: nonAdminUsers, drilldownTitle: 'All Users' };
    }
    if (drilldown.kpi === 'active') {
      return {
        drilldownUsers: users.filter((u) => u.is_active),
        drilldownTitle: 'Active Users',
      };
    }
    return {
      drilldownUsers: users.filter((u) => !u.is_active),
      drilldownTitle: 'Inactive Users',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drilldown, users, provinces]);

  const filteredUsers = useMemo(() => {
    let list = [...drilldownUsers];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          userTowns(u).some((town) => town.toLowerCase().includes(q))
      );
    }
    if (roleFilter) {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (statusFilter) {
      list = list.filter((u) => (statusFilter === 'active' ? u.is_active : !u.is_active));
    }

    list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [drilldownUsers, search, roleFilter, statusFilter]);

  const closeDrilldown = () => {
    setDrilldown(null);
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
  };

  // Sites grouped by Province → District → Town for the picker
  const groupedSiteOptions = useMemo(() => {
    const groups: { label: string; sites: typeof sites }[] = [];
    provinces.forEach((province) => {
      const districtsInProvince = districts.filter((d) => d.province_id === province.id);
      districtsInProvince.forEach((district) => {
        const townsInDistrict = towns.filter((t) => t.district_id === district.id);
        townsInDistrict.forEach((town) => {
          const sitesInTown = sites.filter((s) => s.town_id === town.id);
          if (sitesInTown.length > 0) {
            groups.push({
              label: `${province.name} — ${district.name} — ${town.name}`,
              sites: sitesInTown,
            });
          }
        });
      });
    });
    return groups;
  }, [provinces, districts, towns, sites]);

  function renderUserDialog() {
    return (
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
            Identity
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                error={!!formErrors.name}
                helperText={formErrors.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                error={!!formErrors.email}
                helperText={formErrors.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
            Access
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ALL_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Provinces (empty = no restriction)</InputLabel>
                <Select
                  multiple
                  value={form.province_ids}
                  label="Provinces (empty = no restriction)"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      province_ids:
                        typeof e.target.value === 'string'
                          ? e.target.value.split(',')
                          : e.target.value,
                    })
                  }
                  renderValue={(selected) =>
                    (selected as string[]).map((id) => provinceName(id)).join(', ')
                  }
                >
                  {provinces.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Leave empty only if this user should see all provinces.
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Sites (empty = no restriction)</InputLabel>
                <Select
                  multiple
                  value={form.site_ids}
                  label="Sites (empty = no restriction)"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      site_ids:
                        typeof e.target.value === 'string'
                          ? e.target.value.split(',')
                          : e.target.value,
                    })
                  }
                  renderValue={(selected) =>
                    (selected as string[])
                      .map((id) => sites.find((s) => s.id === id)?.name ?? id)
                      .join(', ')
                  }
                >
                  {groupedSiteOptions.flatMap((group) => [
                    <ListSubheader key={group.label}>{group.label}</ListSubheader>,
                    ...group.sites.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    )),
                  ])}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingId ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  function renderViewDialog() {
    return (
      <Dialog open={!!viewingUser} onClose={() => setViewingUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {viewingUser && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography>{viewingUser.name}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography>{viewingUser.email}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography>{viewingUser.phone || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Role
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={viewingUser.role} size="small" />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Provinces
                </Typography>
                <Typography>
                  {viewingUser.province_ids.length === 0
                    ? 'No restriction'
                    : viewingUser.province_ids.map((id) => provinceName(id)).join(', ')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Sites
                </Typography>
                <Typography>
                  {viewingUser.site_ids.length === 0
                    ? 'No restriction'
                    : viewingUser.site_ids
                        .map((id) => sites.find((s) => s.id === id)?.name ?? id)
                        .join(', ')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={viewingUser.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={viewingUser.is_active ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography>{viewingUser.created_at}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  function renderDeleteDialog() {
    return (
      <Dialog open={!!userToDelete} onClose={() => setUserToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  function renderToggleDialog() {
    return (
      <Dialog open={!!userToToggle} onClose={() => setUserToToggle(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Deactivate User</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to deactivate <strong>{userToToggle?.name}</strong>? They will no
            longer be able to log in until reactivated.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setUserToToggle(null)}>Cancel</Button>
            <Button variant="contained" color="warning" onClick={confirmToggle}>
              Deactivate
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  function renderAdminDialog() {
    return (
      <Dialog open={adminOpen} onClose={() => setAdminOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add System Administrator</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={adminForm.name}
              error={!!adminErrors.name}
              helperText={adminErrors.name}
              onChange={(e) => {
                setAdminForm({ ...adminForm, name: e.target.value });
                if (adminErrors.name) setAdminErrors({ ...adminErrors, name: undefined });
              }}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={adminForm.email}
              error={!!adminErrors.email}
              helperText={adminErrors.email}
              onChange={(e) => {
                setAdminForm({ ...adminForm, email: e.target.value });
                if (adminErrors.email) setAdminErrors({ ...adminErrors, email: undefined });
              }}
            />
            <TextField
              label="Phone"
              fullWidth
              value={adminForm.phone}
              onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAdmin}>
            Create Admin
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // ---------- DRILLDOWN VIEW ----------
  if (drilldown) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={closeDrilldown} sx={{ mb: 2 }}>
          Back to User Management
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">{drilldownTitle}</Typography>
          {drilldown.type === 'province' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openCreateInProvince(drilldown.provinceId)}
            >
              Add User
            </Button>
          )}
        </Box>

        {blockedMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
            {blockedMessage}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search name, email, or town"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <MenuItem value="">All Roles</MenuItem>
              {ALL_ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <DataGrid
          rows={filteredUsers}
          autoHeight
          pageSizeOptions={[10, 25]}
          disableRowSelectionOnClick
          columns={[
            { field: 'name', headerName: 'Name', flex: 1 },
            { field: 'email', headerName: 'Email', flex: 1.5 },
            {
              field: 'role',
              headerName: 'Role',
              width: 140,
              renderCell: ({ row }) => <Chip label={row.role} size="small" />,
            },
            {
              field: 'town',
              headerName: 'Town',
              flex: 1,
              renderCell: ({ row }) => {
                const townNames = userTowns(row);
                return townNames.length === 0 ? '—' : townNames.join(', ');
              },
            },
            {
              field: 'project',
              headerName: 'Project',
              flex: 1,
              renderCell: ({ row }) => {
                const proj = userProjects(row);
                return proj.length === 0 ? '—' : proj.join(', ');
              },
            },
            {
              field: 'is_active',
              headerName: 'Status',
              width: 130,
              renderCell: ({ row }) => (
                <Chip
                  label={row.is_active ? 'Active' : 'Inactive'}
                  size="small"
                  color={row.is_active ? 'success' : 'default'}
                  onClick={() => requestToggle(row)}
                />
              ),
            },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 72,
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              align: 'center',
              headerAlign: 'center',
              renderCell: ({ row }) => (
                <RowActionsMenu
                  actions={[
                    {
                      key: 'view',
                      label: 'View',
                      icon: <VisibilityIcon fontSize="small" />,
                      onClick: () => setViewingUser(row),
                    },
                    {
                      key: 'edit',
                      label: 'Edit',
                      icon: <EditIcon fontSize="small" />,
                      onClick: () => openEdit(row),
                    },
                    {
                      key: 'toggle',
                      label: row.is_active ? 'Deactivate' : 'Activate',
                      icon: <ToggleOnIcon fontSize="small" />,
                      onClick: () => requestToggle(row),
                    },
                    {
                      key: 'delete',
                      label: 'Delete',
                      icon: <DeleteIcon fontSize="small" />,
                      destructive: true,
                      dividerBefore: true,
                      onClick: () => requestDelete(row),
                    },
                  ]}
                />
              ),
            },
          ]}
        />

        {renderUserDialog()}
        {renderViewDialog()}
        {renderDeleteDialog()}
        {renderToggleDialog()}
      </Box>
    );
  }

  // ---------- MAIN VIEW ----------
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
            User Management
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add User
        </Button>
      </Box>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            onClick={() => setDrilldown({ type: 'kpi', kpi: 'total' })}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: 3,
              transition: 'box-shadow 0.2s ease',
              '&:hover': { boxShadow: 4 },
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Total Users
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {users.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            onClick={() => setDrilldown({ type: 'kpi', kpi: 'active' })}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: 3,
              transition: 'box-shadow 0.2s ease',
              '&:hover': { boxShadow: 4 },
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Active Users
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {activeUsers}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            onClick={() => setDrilldown({ type: 'kpi', kpi: 'inactive' })}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: 3,
              transition: 'box-shadow 0.2s ease',
              '&:hover': { boxShadow: 4 },
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Inactive Users
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
              {inactiveUsers}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* System Administrators section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettingsIcon color="primary" />
            <Typography variant="h6">System Administrators</Typography>
            <Chip label={systemAdmins.length} size="small" sx={{ ml: 1 }} />
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAdminOpen(true)}
          >
            Add Admin
          </Button>
        </Box>
        {systemAdmins.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No system administrators found.
          </Typography>
        ) : (
          systemAdmins.map((admin) => (
            <Box
              key={admin.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{admin.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {admin.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={admin.is_active ? 'Active' : 'Inactive'}
                  size="small"
                  color={admin.is_active ? 'success' : 'default'}
                />
                <RowActionsMenu
                  actions={[
                    {
                      key: 'view',
                      label: 'View',
                      icon: <VisibilityIcon fontSize="small" />,
                      onClick: () => setViewingUser(admin),
                    },
                    {
                      key: 'edit',
                      label: 'Edit',
                      icon: <EditIcon fontSize="small" />,
                      onClick: () => openEdit(admin),
                    },
                    {
                      key: 'toggle',
                      label: admin.is_active ? 'Deactivate' : 'Activate',
                      icon: <ToggleOnIcon fontSize="small" />,
                      onClick: () => requestToggle(admin),
                    },
                    {
                      key: 'delete',
                      label: 'Delete',
                      icon: <DeleteIcon fontSize="small" />,
                      destructive: true,
                      dividerBefore: true,
                      onClick: () => requestDelete(admin),
                    },
                  ]}
                />
              </Box>
            </Box>
          ))
        )}
      </Paper>

      {/* Province cards */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Users by Province
      </Typography>
      <Grid container spacing={2}>
        {provinces.map((province) => {
          const count = usersByProvince(province.id).length;
          return (
            <Grid key={province.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                onClick={() => setDrilldown({ type: 'province', provinceId: province.id })}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                  '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                }}
              >
                <PublicIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {province.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {count} user{count === 1 ? '' : 's'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {renderUserDialog()}
      {renderViewDialog()}
      {renderDeleteDialog()}
      {renderToggleDialog()}
      {renderAdminDialog()}
    </Box>
  );
}
