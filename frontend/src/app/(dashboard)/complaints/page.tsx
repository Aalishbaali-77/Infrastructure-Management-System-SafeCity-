'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DataTable from '@/components/organisms/DataTable';
import StatusChip from '@/components/molecules/StatusChip';
import Toast from '@/components/atoms/Toast';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { usePermission } from '@/hooks/usePermission';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { useGetSiteProgressTasksQuery } from '@/store/api/progressApi';
import { useGetDeviationsQuery, useCreateDeviationMutation } from '@/store/api/deviationApi';
import type { Deviation, DeviationSeverity } from '@/types/deviation';
import type { Site } from '@/types/site';
import { formatDate } from '@/utils/formatDate';
import type { RootState } from '@/store';

const severityColor: Record<DeviationSeverity, 'error' | 'warning' | 'default'> = {
  CRITICAL: 'error',
  MAJOR: 'warning',
  MINOR: 'default',
};

const complaintSchema = z.object({
  site_id: z.string().uuid('Select a site'),
  site_task_id: z.string().optional(),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
  description: z.string().min(1, 'Description is required'),
  remarks: z.string().optional(),
});

type ComplaintFormData = z.input<typeof complaintSchema>;

export default function ComplaintsPage() {
  const router = useRouter();
  const { hasAnyRole } = usePermission();
  const canRaise = hasAnyRole(['SITE_ENG', 'CONTRACTOR', 'QA', 'SYSTEM_ADMIN']);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const { data: sitesData, isLoading: loadingSites } = useGetSitesQuery({ page_size: 200 });
  const allSites = sitesData?.data ?? [];

  const scopedSites = useMemo(() => {
    const userSiteIds = currentUser?.siteIds;
    if (!userSiteIds || userSiteIds.length === 0) return allSites;
    return allSites.filter((s) => userSiteIds.includes(s.id));
  }, [allSites, currentUser]);

  const {
    data: deviationsData,
    isLoading: loadingMine,
    refetch,
  } = useGetDeviationsQuery({
    page_size: 100,
  });

  const myComplaints = useMemo(() => {
    const all = deviationsData?.data ?? [];
    if (!currentUser?.id) return [];
    return all.filter((d) => d.raised_by_id === currentUser.id);
  }, [deviationsData, currentUser]);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
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

  useEffect(() => {
    document.title = 'Complaints | SC-GIMS';
  }, []);

  useEffect(() => {
    setValue('site_task_id', '');
  }, [formSiteId, setValue]);

  if (loadingSites) return <PageSkeleton />;

  if (!canRaise) {
    return (
      <Box>
        <Alert severity="warning">You don't have access to raise complaints.</Alert>
      </Box>
    );
  }

  const onSubmit = async (data: ComplaintFormData) => {
    try {
      await createDeviation({
        site_id: data.site_id,
        site_task_id: data.site_task_id || undefined,
        deviation_type: 'OTHER',
        severity: data.severity as DeviationSeverity,
        description: data.description,
        remarks: data.remarks || '',
      }).unwrap();
      setToast({ open: true, message: 'Complaint submitted', severity: 'success' });
      reset({ site_id: '', site_task_id: '', severity: 'MINOR', description: '', remarks: '' });
      refetch();
    } catch (e) {
      setToast({
        open: true,
        message:
          (e as { data?: { detail?: string } })?.data?.detail || 'Failed to submit complaint.',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Complaints
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Report an issue
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Controller
              name="site_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={scopedSites}
                  getOptionLabel={(s: Site) => s.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  value={formSelectedSite}
                  onChange={(_, newValue) => field.onChange(newValue?.id ?? '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Site"
                      error={!!errors.site_id}
                      helperText={errors.site_id?.message}
                    />
                  )}
                />
              )}
            />
            <Controller
              name="site_task_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Task (optional)"
                  fullWidth
                  disabled={!formSiteId}
                >
                  <MenuItem value="">No specific task</MenuItem>
                  {formTasks.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name} ({t.key})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Severity" fullWidth>
                  {['CRITICAL', 'MAJOR', 'MINOR'].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="What happened?"
                  fullWidth
                  multiline
                  minRows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Additional remarks (optional)"
                  fullWidth
                  multiline
                  minRows={2}
                />
              )}
            />
            <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Submitting…' : 'Submit complaint'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>
        My Submissions
      </Typography>

      {loadingMine ? (
        <PageSkeleton />
      ) : (
        <DataTable
          rows={myComplaints}
          onRowClick={(params) => router.push(`/deviations/${params.row.id}`)}
          columns={[
            { field: 'ncr_number', headerName: 'Reference #', flex: 0.8 },
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
              headerName: 'Submitted',
              flex: 0.8,
              renderCell: ({ row }: { row: Deviation }) => formatDate(row.created_at),
            },
          ]}
          rowCount={myComplaints.length}
          paginationModel={{ page: 0, pageSize: 25 }}
          onPaginationModelChange={() => {}}
        />
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Box>
  );
}
