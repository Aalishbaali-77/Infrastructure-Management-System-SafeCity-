'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DataTable from '@/components/organisms/DataTable';
import StatusChip from '@/components/molecules/StatusChip';
import Toast from '@/components/atoms/Toast';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { usePermission } from '@/hooks/usePermission';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetProvincesQuery } from '@/store/api/provinceApi';
import { useGetSiteProgressTasksQuery } from '@/store/api/progressApi';
import {
  useGetDeviationsQuery,
  useGetDeviationStatsQuery,
  useCreateDeviationMutation,
  useDeleteDeviationMutation,
} from '@/store/api/deviationApi';
import type { Deviation, DeviationSeverity } from '@/types/deviation';
import type { Site } from '@/types/site';
import { formatDate } from '@/utils/formatDate';
import type { RootState } from '@/store';

const severityColor: Record<DeviationSeverity, 'error' | 'warning' | 'default'> = {
  CRITICAL: 'error',
  MAJOR: 'warning',
  MINOR: 'default',
};

const CLOSED_STATUSES = ['APPROVED', 'REJECTED', 'CLOSED'];

const raiseIssueSchema = z.object({
  site_id: z.string().uuid('Select a site'),
  site_task_id: z.string().optional(),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
  description: z.string().min(1, 'Description is required'),
  remarks: z.string().optional(),
});

type RaiseIssueFormData = z.input<typeof raiseIssueSchema>;

export default function DeviationsPage() {
  const router = useRouter();
  const { hasAnyRole, hasRole } = usePermission();
  const canRaiseIssue = hasAnyRole(['SITE_ENG', 'CONTRACTOR', 'HOD', 'QA', 'SYSTEM_ADMIN']);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [deviationToDelete, setDeviationToDelete] = useState<Deviation | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState<{ id: string; name: string } | null>(null);
  const [projectFilter, setProjectFilter] = useState<{ id: string; name: string } | null>(null);
  const [siteFilter, setSiteFilter] = useState<Site | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const { data: provincesData } = useGetProvincesQuery({ page_size: 200 });
  const allProvinces = provincesData?.data ?? [];

  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });
  const allProjects = projectsData?.data ?? [];
const scopedProjects = useMemo(() => {
  if (!provinceFilter) return allProjects;
  return allProjects.filter((p) => p.province_id === provinceFilter.id);
}, [allProjects, provinceFilter]);
  const { data: sitesData, isLoading: loadingSites } = useGetSitesQuery({ page_size: 200 });
  const allSites = sitesData?.data ?? [];

  const scopedSites = useMemo(() => {
    const userSiteIds = currentUser?.siteIds;
    let sites = allSites;
    if (userSiteIds && userSiteIds.length > 0) {
      sites = sites.filter((s) => userSiteIds.includes(s.id));
    }
    if (provinceFilter) {
      sites = sites.filter((s) => s.province_id === provinceFilter.id);
    }
    if (projectFilter) {
      sites = sites.filter((s) => s.project_id === projectFilter.id);
    }
    return sites;
  }, [allSites, currentUser, provinceFilter, projectFilter]);

  // If the selected site no longer belongs to the selected project, clear it
  useEffect(() => {
    if (siteFilter && projectFilter && siteFilter.project_id !== projectFilter.id) {
      setSiteFilter(null);
    }
  }, [projectFilter, siteFilter]);

  // If the selected site no longer belongs to the selected province, clear it
  useEffect(() => {
    if (siteFilter && provinceFilter && siteFilter.province_id !== provinceFilter.id) {
      setSiteFilter(null);
    }
  }, [provinceFilter, siteFilter]);

  const sharedFilterParams = {
    project_id: projectFilter?.id || undefined,
    site_id: siteFilter?.id || undefined,
    status: statusFilter || undefined,
  };

  const {
    data: deviationsData,
    isLoading: loadingDeviations,
    refetch,
  } = useGetDeviationsQuery({
    ...sharedFilterParams,
    page_size: 100,
  });
  const deviations = deviationsData?.data ?? [];

  const { data: stats } = useGetDeviationStatsQuery(sharedFilterParams);

  const criticalOpen = useMemo(() => {
    if (!stats) return 0;
    return stats.by_severity?.CRITICAL ?? 0;
  }, [stats]);

  const pendingApproval = useMemo(() => {
    if (!stats) return 0;
    const byStatus = stats.by_status ?? {};
    return Object.entries(byStatus).reduce(
      (sum, [key, count]) => (CLOSED_STATUSES.includes(key) ? sum : sum + count),
      0
    );
  }, [stats]);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RaiseIssueFormData>({
    resolver: zodResolver(raiseIssueSchema),
    defaultValues: {
      site_id: '',
      site_task_id: '',
      severity: 'MINOR',
      description: '',
      remarks: '',
    },
  });

  const formSiteId = watch('site_id');
  const formSelectedSite = scopedSites.find((s) => s.id === formSiteId) ?? null;

  const { data: tasksData } = useGetSiteProgressTasksQuery(
    { site_id: formSiteId, is_active: 'true', page_size: 100 },
    { skip: !formSiteId }
  );
  const formTasks = tasksData?.data ?? [];

  const [createDeviation, { isLoading: saving }] = useCreateDeviationMutation();
  const [deleteDeviation] = useDeleteDeviationMutation();

  useEffect(() => {
    document.title = 'Deviations | SC-GIMS';
  }, []);

  useEffect(() => {
    setValue('site_task_id', '');
  }, [formSiteId, setValue]);

  if (loadingSites) return <PageSkeleton />;

  const onSubmit = async (data: RaiseIssueFormData) => {
    try {
      await createDeviation({
        site_id: data.site_id,
        site_task_id: data.site_task_id || undefined,
        deviation_type: 'OTHER',
        severity: data.severity as DeviationSeverity,
        description: data.description,
        remarks: data.remarks || '',
      }).unwrap();
      setToast({ open: true, message: 'Deviation raised', severity: 'success' });
      reset({ site_id: '', site_task_id: '', severity: 'MINOR', description: '', remarks: '' });
      setShowForm(false);
      refetch();
    } catch (e) {
      setToast({
        open: true,
        message:
          (e as { data?: { detail?: string } })?.data?.detail || 'Failed to raise deviation.',
        severity: 'error',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deviationToDelete) return;
    try {
      await deleteDeviation(deviationToDelete.id).unwrap();
      setToast({ open: true, message: 'Deviation deleted', severity: 'success' });
      refetch();
    } catch (e) {
      setToast({
        open: true,
        message:
          (e as { data?: { detail?: string } })?.data?.detail || 'Failed to delete deviation.',
        severity: 'error',
      });
    }
    setDeviationToDelete(null);
  };

  const severityEntries = Object.entries(stats?.by_severity ?? {});
  const statusEntries = Object.entries(stats?.by_status ?? {});
  const maxStatusCount = Math.max(1, ...statusEntries.map(([, c]) => c));

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <IconButton
            onClick={() => router.back()}
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
            Deviations
          </Typography>
        </Stack>

      </Stack>
 <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
        
        <Autocomplete
  options={allProvinces}
  getOptionLabel={(p: { id: string; name: string }) => p.name}
  isOptionEqualToValue={(a, b) => a.id === b.id}
  value={provinceFilter}
  onChange={(_, newValue) => setProvinceFilter(newValue)}
  sx={{ minWidth: 180 }}
  renderInput={(params) => <TextField {...params} label="Province" size="small" />}
/>
  <Autocomplete
  options={scopedProjects}
  getOptionLabel={(p: { id: string; name: string }) => p.name}
  isOptionEqualToValue={(a, b) => a.id === b.id}
  value={projectFilter}
  onChange={(_, newValue) => setProjectFilter(newValue)}
  sx={{ minWidth: 220 }}
  renderInput={(params) => <TextField {...params} label="Project" size="small" />}
/>
          <Autocomplete
            options={scopedSites}
            getOptionLabel={(s: Site) => s.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={siteFilter}
            onChange={(_, newValue) => setSiteFilter(newValue)}
            sx={{ minWidth: 220 }}
            renderInput={(params) => <TextField {...params} label="Site" size="small" />}
          />
          <TextField
            select
            label="Status"
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {[
              'DRAFT',
              'SUBMITTED',
              'HOD_REVIEW',
              'DIR_REVIEW',
              'APPROVED',
              'REJECTED',
              'CONDITIONAL',
              'CLOSED',
            ].map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* KPI summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total deviations
            </Typography>
            <Typography variant="h5">{stats?.total ?? 0}</Typography>
          </Paper>
          
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, bgcolor: 'error.lighter' }}>
            <Typography variant="body2" color="error.dark">
              Critical
            </Typography>
            <Typography variant="h5" color="error.dark">
              {criticalOpen}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, bgcolor: 'warning.lighter' }}>
            <Typography variant="body2" color="warning.dark">
              Pending approval
            </Typography>
            <Typography variant="h5" color="warning.dark">
              {pendingApproval}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              By severity
            </Typography>
            {severityEntries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No data
              </Typography>
            ) : (
              <Stack spacing={1}>
                {severityEntries.map(([sev, count]) => (
                  <Stack key={sev} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ width: 70 }}>
                      {sev}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(count / (stats?.total || 1)) * 100}
                      color={sev === 'CRITICAL' ? 'error' : sev === 'MAJOR' ? 'warning' : 'inherit'}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption">{count}</Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              By status
            </Typography>
            {statusEntries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No data
              </Typography>
            ) : (
              <Stack spacing={1}>
                {statusEntries.map(([st, count]) => (
                  <Stack key={st} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ width: 90 }}>
                      {st.replace(/_/g, ' ')}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(count / maxStatusCount) * 100}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption">{count}</Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

     
     

      {loadingDeviations ? (
        <PageSkeleton />
      ) : (
        <DataTable
          rows={deviations}
          onRowClick={(params) => router.push(`/deviations/${params.row.id}`)}
          columns={[
            { field: 'ncr_number', headerName: 'NCR #', flex: 0.8 },
            { field: 'site_name', headerName: 'Site', flex: 0.9 },
            {
              field: 'description',
              headerName: 'Description',
              flex: 1.6,
              renderCell: ({ row }: { row: Deviation }) => (
                <Typography variant="body2" noWrap title={row.description}>
                  {row.description && row.description.length > 60
                    ? `${row.description.slice(0, 60)}…`
                    : row.description}
                </Typography>
              ),
            },
            {
              field: 'severity',
              headerName: 'Severity',
              flex: 0.7,
              renderCell: ({ row }: { row: Deviation }) => (
                <Chip size="small" label={row.severity} color={severityColor[row.severity]} />
              ),
            },
            {
              field: 'status',
              headerName: 'Status',
              flex: 0.9,
              renderCell: ({ row }: { row: Deviation }) => <StatusChip status={row.status} />,
            },
            {
              field: 'created_at',
              headerName: 'Created',
              flex: 0.8,
              renderCell: ({ row }: { row: Deviation }) => formatDate(row.created_at),
            },
            {
              field: 'actions',
              headerName: 'Actions',
              flex: 0.7,
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              align: 'center',
              headerAlign: 'center',
              renderCell: ({ row }: { row: Deviation }) => {
                const canDelete =
                  row.status === 'DRAFT' &&
                  (currentUser?.id === row.raised_by_id || hasRole('SYSTEM_ADMIN'));
                return (
                  <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      aria-label="View"
                      onClick={() => router.push(`/deviations/${row.id}`)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {canDelete && (
                      <IconButton
                        size="small"
                        aria-label="Delete"
                        color="error"
                        onClick={() => setDeviationToDelete(row)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                );
              },
            },
          ]}
          rowCount={deviations.length}
          paginationModel={{ page: 0, pageSize: 25 }}
          onPaginationModelChange={() => {}}
        />
      )}

      <Dialog open={!!deviationToDelete} onClose={() => setDeviationToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Deviation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            <strong>{deviationToDelete?.ncr_number}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviationToDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Box>
  );
}