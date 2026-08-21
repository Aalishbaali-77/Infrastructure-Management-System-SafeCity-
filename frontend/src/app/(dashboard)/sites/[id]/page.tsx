'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useGetBoqsQuery } from '@/store/api/boqApi';
import { useBreadcrumbLabel } from '@/contexts/BreadcrumbContext';
import {
  addWorkPackage,
  updateWorkPackage,
  deleteWorkPackage,
} from '@/store/slices/workPackagesSlice';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useGetProjectQuery } from '@/store/api/projectApi';
import { useGetSiteQuery } from '@/store/api/siteApi';
import { useGetUsersQuery } from '@/store/api/userApi';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StatusChip from '@/components/molecules/StatusChip';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import type { WorkPackage, TCPhase, WorkPackageStatus, Discipline } from '@/types/workPackage';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const TC_PHASES: TCPhase[] = [
  'NOT_STARTED',
  'FAT',
  'SAT',
  'SIT',
  'PAT',
  'UAT',
  'RLT',
  'COMMISSIONING',
  'HANDOVER',
  'COMPLETE',
];

const WP_STATUSES: WorkPackageStatus[] = ['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED'];

const emptyForm = {
  discipline: '' as Discipline | '',
  name: '',
  contractor_id: '',
  contract_reference: '',
  start_date: '',
  end_date: '',
  tc_phase: 'NOT_STARTED' as TCPhase,
  status: 'PLANNED' as WorkPackageStatus,
};

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const siteId = params.id as string;

  const { data: site, isLoading, isError } = useGetSiteQuery(siteId);
  const { data: project } = useGetProjectQuery(site?.project_id ?? '', { skip: !site?.project_id });
  useBreadcrumbLabel(`/sites/${siteId}`, site?.name);
  const { data: usersData } = useGetUsersQuery({ role: 'CONTRACTOR', page_size: 100 });

  const workPackages = useSelector((state: RootState) => state.workPackages.list);
  const disciplines = useSelector((state: RootState) => state.disciplines.list);

  const { canCreate, canUpdate, canDelete } = useCrudPermission('/work-packages');
  const { data: boqsData } = useGetBoqsQuery(
    { project_id: site?.project_id, page_size: 50 },
    { skip: !site?.project_id }
  );

  const contractors = usersData?.data ?? [];
  const workPackagesForSite = workPackages.filter((wp) => wp.site_id === siteId);

  const [open, setOpen] = useState(false);
  const [editingWp, setEditingWp] = useState<WorkPackage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [wpToDelete, setWpToDelete] = useState<WorkPackage | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = site ? `${site.name} | SC-GIMS` : 'Site Not Found | SC-GIMS';
  }, [site]);

  if (isLoading) return <PageSkeleton />;

  if (isError || !site) {
    return (
      <Box>
        <Typography variant="h5">Site not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/sites')} sx={{ mt: 2 }}>
          Back to Sites
        </Button>
      </Box>
    );
  }

  const locationParts = [site.town_name, site.district_name, site.province_name].filter(Boolean);
  const boqsForSite = boqsData?.data ?? [];

  const disciplineLabel = (name: string) => disciplines.find((d) => d.name === name)?.label ?? name;
  const contractorName = (id: string | null) =>
    id ? (contractors.find((u) => u.id === id)?.name ?? id) : '—';

  const openCreate = () => {
    setEditingWp(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (wp: WorkPackage) => {
    setEditingWp(wp);
    setForm({
      discipline: wp.discipline,
      name: wp.name,
      contractor_id: wp.contractor_id ?? '',
      contract_reference: wp.contract_reference ?? '',
      start_date: wp.start_date,
      end_date: wp.end_date ?? '',
      tc_phase: wp.tc_phase,
      status: wp.status,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.discipline || !form.name || !form.start_date) return;
    const today = new Date().toISOString().split('T')[0];
    if (editingWp) {
      dispatch(
        updateWorkPackage({
          id: editingWp.id,
          changes: {
            discipline: form.discipline,
            name: form.name,
            contractor_id: form.contractor_id || null,
            contract_reference: form.contract_reference || null,
            start_date: form.start_date,
            end_date: form.end_date || undefined,
            tc_phase: form.tc_phase,
            status: form.status,
            updated_at: today,
          },
        })
      );
    } else {
      dispatch(
        addWorkPackage({
          id: `wp-${Date.now()}`,
          site_id: siteId,
          discipline: form.discipline,
          name: form.name,
          contractor_id: form.contractor_id || null,
          contract_reference: form.contract_reference || null,
          start_date: form.start_date,
          end_date: form.end_date || undefined,
          tc_phase: form.tc_phase,
          status: form.status,
          created_at: today,
          updated_at: today,
        })
      );
    }
    setOpen(false);
  };

  const requestDelete = (wp: WorkPackage) => {
    setBlockedMessage(null);
    setWpToDelete(wp);
  };

  const confirmDelete = () => {
    if (wpToDelete) dispatch(deleteWorkPackage(wpToDelete.id));
    setWpToDelete(null);
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/sites')} sx={{ mb: 2 }}>
        Back to Sites
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h5" component="h1">
          {site.name}
        </Typography>
        <StatusChip status={site.status} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {[site.location, locationParts.join(', ')].filter(Boolean).join(' · ')}
      </Typography>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Project
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{project?.name ?? '—'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {project?.program_code}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Geofence Radius
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {site.geofence_radius_m ? `${site.geofence_radius_m} m` : '—'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Work Packages</Typography>
          {canCreate && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
              Add Work Package
            </Button>
          )}
        </Box>
        {workPackagesForSite.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No work packages created for this site yet.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {workPackagesForSite.map((wp) => (
              <Box
                key={wp.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{wp.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={disciplineLabel(wp.discipline)} size="small" />
                    <Chip label={wp.tc_phase.replace(/_/g, ' ')} size="small" color="info" />
                    <StatusChip status={wp.status} />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Contractor: {contractorName(wp.contractor_id)}
                    {wp.contract_reference ? ` · Ref: ${wp.contract_reference}` : ''}
                  </Typography>
                </Box>
                <RowActionsMenu
                  actions={[
                    ...(canUpdate
                      ? [
                          {
                            key: 'edit',
                            label: 'Edit',
                            icon: <EditIcon fontSize="small" />,
                            onClick: () => openEdit(wp),
                          },
                        ]
                      : []),
                    ...(canDelete
                      ? [
                          {
                            key: 'delete',
                            label: 'Delete',
                            icon: <DeleteIcon fontSize="small" />,
                            destructive: true,
                            dividerBefore: true,
                            onClick: () => requestDelete(wp),
                          },
                        ]
                      : []),
                  ]}
                />
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          BOQ (landed cost)
        </Typography>
        {boqsForSite.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No BOQ for this site yet. Create one under BOQ to import the PC1 → TotalDDP spreadsheet.
          </Typography>
        ) : (
          boqsForSite.map((boq) => (
            <Box
              key={boq.id}
              onClick={() => router.push(`/boq/${boq.id}`)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                cursor: 'pointer',
                gap: 2,
                flexWrap: 'wrap',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box>
                <Typography>
                  {boq.template || 'BOQ'} — v{boq.version} · {boq.items_count} items
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  TotalDDP PKR {Number(boq.total_amount || 0).toLocaleString()}
                </Typography>
              </Box>
              <StatusChip status={boq.status} />
            </Box>
          ))
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Open Deviations (0)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No open deviations for this site.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Daily Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No progress entries recorded for this site yet.
        </Typography>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingWp ? 'Edit Work Package' : 'Add Work Package'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Discipline"
                value={form.discipline}
                onChange={(e) => setForm({ ...form, discipline: e.target.value as Discipline })}
              >
                {disciplines.map((d) => (
                  <MenuItem key={d.id} value={d.name}>
                    {d.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Contractor"
                value={form.contractor_id}
                onChange={(e) => setForm({ ...form, contractor_id: e.target.value })}
              >
                <MenuItem value="">None assigned</MenuItem>
                {contractors.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Contract Reference"
                value={form.contract_reference}
                onChange={(e) => setForm({ ...form, contract_reference: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="Start Date"
                format="DD-MMM-YYYY"
                value={form.start_date ? dayjs(form.start_date) : null}
                onChange={(newValue) =>
                  setForm({
                    ...form,
                    start_date: newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '',
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="End Date"
                format="DD-MMM-YYYY"
                value={form.end_date ? dayjs(form.end_date) : null}
                onChange={(newValue) =>
                  setForm({
                    ...form,
                    end_date: newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '',
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                select
                label="T&C Phase"
                value={form.tc_phase}
                onChange={(e) => setForm({ ...form, tc_phase: e.target.value as TCPhase })}
              >
                {TC_PHASES.map((phase) => (
                  <MenuItem key={phase} value={phase}>
                    {phase.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as WorkPackageStatus })}
              >
                {WP_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name || !form.discipline || !form.start_date}
          >
            {editingWp ? 'Save Changes' : 'Add Work Package'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!wpToDelete} onClose={() => setWpToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Work Package</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete <strong>{wpToDelete?.name}</strong>? This action cannot
            be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setWpToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
