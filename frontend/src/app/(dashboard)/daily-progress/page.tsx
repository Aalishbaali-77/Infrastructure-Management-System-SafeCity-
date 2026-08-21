'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DataTable from '@/components/organisms/DataTable';
import Toast from '@/components/atoms/Toast';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { usePermission } from '@/hooks/usePermission';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import {
  useCreateDailyProgressMutation,
  useGetDailyProgressQuery,
  useGetSiteProgressTasksQuery,
  useUpdateDailyProgressMutation,
} from '@/store/api/progressApi';
import type { DailyProgressEntry, KpiValueType, SiteProgressTask } from '@/types/dailyProgress';
import type { Site } from '@/types/site';
import { formatDate } from '@/utils/formatDate';
import type { RootState } from '@/store';

const progressSchema = z.object({
  site_id: z.string().uuid('Select a site'),
  site_task_id: z.string().uuid('Select a task'),
  date: z.string().min(1, 'Date is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  kpi_values: z.record(z.string(), z.unknown()).default({}),
  remarks: z.string().optional(),
});

type ProgressFormData = z.input<typeof progressSchema>;

function formatKpiValue(value: unknown, type: KpiValueType): string {
  if (value === undefined || value === null || value === '') return '—';
  if (type === 'boolean') return value ? 'done' : 'pending';
  if (type === 'number') {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString() : String(value);
  }
  return String(value);
}

export default function DailyProgressPage() {
  const router = useRouter();
  const { canCreate, canUpdate } = useCrudPermission('/daily-progress');
  const { hasAnyRole } = usePermission();
  const canManageTasks = hasAnyRole(['SYSTEM_ADMIN', 'HOD', 'DIR']);
  const canManageAllEntries = hasAnyRole(['SYSTEM_ADMIN', 'HOD', 'DIR']);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyProgressEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<DailyProgressEntry | null>(null);
  const [projectFilter, setProjectFilter] = useState('');
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });
  const allProjects = projectsData?.data ?? [];

  const { data: sitesData, isLoading: loadingSites } = useGetSitesQuery({ page_size: 200 });
  const allSites = sitesData?.data ?? [];

  // A user with specific sites assigned only sees those sites here —
  // same convention as Admin → Users ("empty = no restriction").
  const scopedSites = useMemo(() => {
    const userSiteIds = currentUser?.siteIds;
    if (!userSiteIds || userSiteIds.length === 0) return allSites;
    return allSites.filter((s) => userSiteIds.includes(s.id));
  }, [allSites, currentUser]);

  // Only show projects that actually have at least one site this user can see.
  const projects = useMemo(() => {
    const projectIdsWithSites = new Set(scopedSites.map((s) => s.project_id));
    return allProjects.filter((p) => projectIdsWithSites.has(p.id));
  }, [allProjects, scopedSites]);

  // Site field narrows to the selected project; if no project chosen yet,
  // show all sites the user is allowed to see.
  const sites = useMemo(() => {
    if (!projectFilter) return scopedSites;
    return scopedSites.filter((s) => s.project_id === projectFilter);
  }, [scopedSites, projectFilter]);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      site_id: '',
      site_task_id: '',
      date: new Date().toISOString().slice(0, 10),
      quantity: '',
      kpi_values: {},
      remarks: '',
    },
  });

  const siteId = watch('site_id');
  const siteTaskId = watch('site_task_id');
  const quantityStr = watch('quantity');

  const selectedSite = sites.find((s) => s.id === siteId) ?? null;

  const { data: tasksData, isLoading: loadingTasks } = useGetSiteProgressTasksQuery(
    { site_id: siteId, is_active: 'true', page_size: 100 },
    { skip: !siteId }
  );
  const tasks = tasksData?.data ?? [];

  const {
    data: entriesData,
    isLoading: loadingEntries,
    refetch,
  } = useGetDailyProgressQuery({ site_id: siteId || undefined, page_size: 100 }, { skip: !siteId });
  const entries = useMemo(() => entriesData?.data ?? [], [entriesData]);

  const latestKpiValueByTask = useMemo(() => {
    const sortedByDateDesc = [...entries].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );
    const map = new Map<string, Map<string, unknown>>();
    for (const entry of sortedByDateDesc) {
      let taskValues = map.get(entry.site_task_id);
      if (!taskValues) {
        taskValues = new Map<string, unknown>();
        map.set(entry.site_task_id, taskValues);
      }
      for (const [key, value] of Object.entries(entry.kpi_values ?? {})) {
        if (taskValues.has(key)) continue;
        if (value === undefined || value === null || value === '') continue;
        taskValues.set(key, value);
      }
    }
    return map;
  }, [entries]);

  const [createEntry, { isLoading: saving }] = useCreateDailyProgressMutation();
  const [updateEntry, { isLoading: updating }] = useUpdateDailyProgressMutation();

  const selectedTask = tasks.find((t) => t.id === siteTaskId);

  const projectedCumulative = useMemo(() => {
    if (!selectedTask) return 0;
    const qty = Number(quantityStr) || 0;
    return Number(selectedTask.cumulative_quantity || 0) + qty;
  }, [selectedTask, quantityStr]);

  const planned = Number(selectedTask?.planned_quantity || 0);
  const overPlan = planned > 0 && projectedCumulative > planned;

  // KPI schema for whichever task the currently-viewed entry belongs to —
  // needed to render labels/types correctly in the read-only detail dialog.
  const viewingTaskSchema = useMemo(() => {
    if (!viewingEntry) return [];
    const task = tasks.find((t) => t.id === viewingEntry.site_task_id);
    return task?.kpi_schema ?? [];
  }, [viewingEntry, tasks]);

  useEffect(() => {
    document.title = 'Daily Progress | SC-GIMS';
  }, []);

  useEffect(() => {
    setValue('site_task_id', '');
  }, [siteId, setValue]);

  if (loadingSites) return <PageSkeleton />;

  const onSubmit = async (data: ProgressFormData) => {
    try {
      if (editingEntry) {
        await updateEntry({
          id: editingEntry.id,
          data: {
            site_task_id: data.site_task_id,
            date: data.date,
            quantity: Number(data.quantity) || 0,
            kpi_values: data.kpi_values ?? {},
            remarks: data.remarks || '',
          },
        }).unwrap();
        setToast({ open: true, message: 'Daily progress entry updated', severity: 'success' });
        setEditingEntry(null);
      } else {
        await createEntry({
          site_id: data.site_id,
          site_task_id: data.site_task_id,
          date: data.date,
          quantity: Number(data.quantity) || 0,
          remarks: data.remarks || '',
          kpi_values: data.kpi_values ?? {},
        }).unwrap();
        setToast({
          open: true,
          message: overPlan
            ? 'Saved — cumulative exceeds planned quantity'
            : 'Daily progress saved',
          severity: overPlan ? 'warning' : 'success',
        });
      }
      reset({
        site_id: data.site_id,
        site_task_id: '',
        date: data.date,
        quantity: '',
        kpi_values: {},
        remarks: '',
      });
      setShowForm(false);
      refetch();
    } catch (e) {
      setToast({
        open: true,
        message:
          (e as { data?: { detail?: string; non_field_errors?: string[] } })?.data?.detail ||
          (e as { data?: { non_field_errors?: string[] } })?.data?.non_field_errors?.[0] ||
          (editingEntry
            ? 'Failed to update entry.'
            : 'Failed to save (duplicate date for this task?)'),
        severity: 'error',
      });
    }
  };

  const startEdit = (entry: DailyProgressEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
    setValue('site_task_id', entry.site_task_id);
    setValue('date', entry.date);
    setValue('quantity', String(entry.quantity));
    setValue('kpi_values', entry.kpi_values ?? {});
    setValue('remarks', entry.remarks || '');
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    reset({
      site_id: siteId,
      site_task_id: '',
      date: new Date().toISOString().slice(0, 10),
      quantity: '',
      kpi_values: {},
      remarks: '',
    });
  };

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
          <Box>
            <Typography variant="h5" component="h1">
              Daily Progress
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            href="/daily-progress/report"
            variant="outlined"
            startIcon={<AssessmentIcon />}
          >
            Progress Report
          </Button>
          <Button
            component={Link}
            href={
              siteId ? `/daily-progress/completion?site_id=${siteId}` : '/daily-progress/completion'
            }
            variant="outlined"
            startIcon={<DonutLargeIcon />}
          >
            Work Progress
          </Button>

          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                if (showForm) cancelEdit();
                setShowForm((v) => !v);
              }}
            >
              {showForm ? 'Close' : 'Log progress'}
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Project"
            size="small"
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setValue('site_id', '');
            }}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="">All projects</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>

          <Controller
            name="site_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={sites}
                getOptionLabel={(s: Site) => s.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={selectedSite}
                onChange={(_, newValue) => field.onChange(newValue?.id ?? '')}
                sx={{ minWidth: 280 }}
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
        </Stack>
      </Paper>

      {showForm && canCreate && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editingEntry ? 'Editing entry' : 'New entry'}
          </Typography>
          {!siteId ? (
            <Alert severity="info">Select a site first.</Alert>
          ) : loadingTasks ? (
            <PageSkeleton />
          ) : tasks.length === 0 ? (
            <Alert severity="warning">
              No active tasks for this site.{' '}
              {canManageTasks ? (
                <Link href="/admin/progress-tasks">Assign tasks in Admin → Progress tasks</Link>
              ) : (
                'Ask an admin to assign progress tasks.'
              )}
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <Controller
                  name="site_task_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Task / KPI"
                      fullWidth
                      error={!!errors.site_task_id}
                      helperText={errors.site_task_id?.message}
                      onChange={(e) => {
                        field.onChange(e);
                        setValue('kpi_values', {});
                      }}
                    >
                      {tasks.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name} ({t.key}){t.boq_item_code ? ` · BOQ ${t.boq_item_code}` : ''} —
                          planned {Number(t.planned_quantity).toLocaleString()} {t.unit}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                {selectedTask && (
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" label={selectedTask.category || 'Task'} />
                      {selectedTask.boq_item_code && (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={`BOQ ${selectedTask.boq_item_code}`}
                          component={Link}
                          href={selectedTask.boq_id ? `/boq/${selectedTask.boq_id}` : '/boq'}
                          clickable
                        />
                      )}
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${Number(selectedTask.cumulative_quantity).toLocaleString()} / ${Number(selectedTask.planned_quantity).toLocaleString()} ${selectedTask.unit}`}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={
                        planned > 0
                          ? Math.min(
                              100,
                              (Number(selectedTask.cumulative_quantity) / planned) * 100
                            )
                          : 0
                      }
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                )}

                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Date"
                      slotProps={{ inputLabel: { shrink: true } }}
                      fullWidth
                      error={!!errors.date}
                      helperText={errors.date?.message}
                    />
                  )}
                />

                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label={`Quantity today (${selectedTask?.unit || 'unit'})`}
                      fullWidth
                      error={!!errors.quantity}
                      helperText={
                        errors.quantity?.message ||
                        (selectedTask
                          ? `Projected cumulative: ${projectedCumulative.toLocaleString()} ${selectedTask.unit}`
                          : undefined)
                      }
                    />
                  )}
                />

                {selectedTask && selectedTask.kpi_schema.length > 0 && (
                  <Controller
                    name="kpi_values"
                    control={control}
                    render={({ field }) => {
                      const kpiValues = (field.value ?? {}) as Record<string, unknown>;
                      return (
                        <Stack spacing={2}>
                          <Typography variant="subtitle2">Subtasks / KPIs</Typography>
                          {selectedTask.kpi_schema.map((kpi) => {
                            if (kpi.value_type === 'boolean') {
                              const boolValue = kpiValues[kpi.key];
                              return (
                                <TextField
                                  key={kpi.key}
                                  select
                                  label={kpi.label}
                                  value={
                                    boolValue === true ? 'yes' : boolValue === false ? 'no' : ''
                                  }
                                  onChange={(e) => {
                                    const next = { ...kpiValues };
                                    if (e.target.value === '') delete next[kpi.key];
                                    else next[kpi.key] = e.target.value === 'yes';
                                    field.onChange(next);
                                  }}
                                  fullWidth
                                >
                                  <MenuItem value="">Not recorded</MenuItem>
                                  <MenuItem value="yes">Yes</MenuItem>
                                  <MenuItem value="no">No</MenuItem>
                                </TextField>
                              );
                            }
                            if (kpi.value_type === 'number') {
                              return (
                                <TextField
                                  key={kpi.key}
                                  type="number"
                                  label={kpi.label}
                                  value={(kpiValues[kpi.key] as number | string) ?? ''}
                                  onChange={(e) => {
                                    const next = { ...kpiValues };
                                    if (e.target.value === '') delete next[kpi.key];
                                    else next[kpi.key] = Number(e.target.value);
                                    field.onChange(next);
                                  }}
                                  fullWidth
                                />
                              );
                            }
                            return (
                              <TextField
                                key={kpi.key}
                                label={kpi.label}
                                value={(kpiValues[kpi.key] as string) ?? ''}
                                onChange={(e) =>
                                  field.onChange({ ...kpiValues, [kpi.key]: e.target.value })
                                }
                                fullWidth
                              />
                            );
                          })}
                        </Stack>
                      );
                    }}
                  />
                )}

                {overPlan && (
                  <Alert severity="warning">
                    This entry would push cumulative above the planned quantity for this task.
                  </Alert>
                )}

                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Remarks" fullWidth multiline minRows={2} />
                  )}
                />

                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  <Button onClick={() => (editingEntry ? cancelEdit() : setShowForm(false))}>
                    {editingEntry ? 'Cancel edit' : 'Cancel'}
                  </Button>
                  <Button type="submit" variant="contained" disabled={saving || updating}>
                    {saving || updating ? 'Saving…' : editingEntry ? 'Update' : 'Save'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      {!siteId ? (
        <Alert severity="info">Select a site to view its recent entries and task status.</Alert>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Site task status
          </Typography>
          {loadingTasks ? (
            <PageSkeleton />
          ) : (
            <Paper sx={{ p: 2, mb: 3, overflowX: 'auto' }}>
              <Stack spacing={1.5}>
                {tasks.map((t: SiteProgressTask) => {
                  const done = Number(t.cumulative_quantity);
                  const plan = Number(t.planned_quantity);
                  const pct = plan > 0 ? Math.min(100, (done / plan) * 100) : 0;
                  return (
                    <Box key={t.id}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mb: 0.5, justifyContent: 'space-between', flexWrap: 'wrap' }}
                      >
                        <Typography variant="body2">
                          <strong>{t.name}</strong>{' '}
                          <Typography component="span" variant="caption" color="text.secondary">
                            [{t.key}]{t.boq_item_code ? ` · BOQ ${t.boq_item_code}` : ''}
                          </Typography>
                        </Typography>
                        <Typography variant="caption">
                          {done.toLocaleString()} / {plan.toLocaleString()} {t.unit}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                      {t.kpi_schema.length > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {t.kpi_schema
                            .map(
                              (kpi) =>
                                `${kpi.label}: ${formatKpiValue(
                                  latestKpiValueByTask.get(t.id)?.get(kpi.key),
                                  kpi.value_type
                                )}`
                            )
                            .join(' · ')}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
                {tasks.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No tasks assigned to this site yet.
                  </Typography>
                )}
              </Stack>
            </Paper>
          )}

          <Typography variant="h6" sx={{ mb: 1 }}>
            Recent entries
          </Typography>
          {loadingEntries ? (
            <PageSkeleton />
          ) : (
            <DataTable
              rows={entries}
              columns={[
                {
                  field: 'date',
                  headerName: 'Date',
                  flex: 0.8,
                  renderCell: ({ row }: { row: DailyProgressEntry }) => formatDate(row.date),
                },
                { field: 'task_name', headerName: 'Task', flex: 1.1 },
                { field: 'task_key', headerName: 'Key', flex: 0.7 },
                {
                  field: 'boq_item_code',
                  headerName: 'BOQ Item',
                  flex: 0.9,
                  renderCell: ({ row }: { row: DailyProgressEntry }) => row.boq_item_code || '—',
                },
                {
                  field: 'quantity',
                  headerName: 'Qty',
                  flex: 0.6,
                  renderCell: ({ row }: { row: DailyProgressEntry }) =>
                    `${Number(row.quantity).toLocaleString()} ${row.task_unit}`,
                },
                {
                  field: 'cumulative_quantity',
                  headerName: 'Cumulative',
                  flex: 0.7,
                  renderCell: ({ row }: { row: DailyProgressEntry }) =>
                    Number(row.cumulative_quantity).toLocaleString(),
                },
                {
                  field: 'planned_quantity',
                  headerName: 'Planned',
                  flex: 0.6,
                  renderCell: ({ row }: { row: DailyProgressEntry }) =>
                    Number(row.planned_quantity).toLocaleString(),
                },
                { field: 'submitted_by_name', headerName: 'By', flex: 1 },
                {
                  field: 'kpi_values',
                  headerName: 'Subtasks',
                  flex: 1.4,
                  sortable: false,
                  renderCell: ({ row }: { row: DailyProgressEntry }) => {
                    const task = tasks.find((t) => t.id === row.site_task_id);
                    if (!task || task.kpi_schema.length === 0) return '—';
                    return task.kpi_schema
                      .map(
                        (kpi) =>
                          `${kpi.label}: ${formatKpiValue(row.kpi_values?.[kpi.key], kpi.value_type)}`
                      )
                      .join(' · ');
                  },
                },
                {
                  field: 'remarks',
                  headerName: 'Remarks',
                  flex: 1.2,
                  renderCell: ({ row }: { row: DailyProgressEntry }) => row.remarks || '—',
                },

                {
                  field: 'actions',
                  headerName: 'Actions',
                  flex: 0.6,
                  sortable: false,
                  filterable: false,
                  disableColumnMenu: true,
                  align: 'center' as const,
                  headerAlign: 'center' as const,
                  renderCell: ({ row }: { row: DailyProgressEntry }) => {
                    const canEditThisRow =
                      canUpdate && (canManageAllEntries || row.submitted_by_id === currentUser?.id);
                    return (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View entry">
                          <IconButton size="small" onClick={() => setViewingEntry(row)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canEditThisRow && (
                          <Tooltip title="Edit entry">
                            <IconButton size="small" onClick={() => startEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    );
                  },
                },
              ]}
              rowCount={entries.length}
              paginationModel={{ page: 0, pageSize: 25 }}
              onPaginationModelChange={() => {}}
            />
          )}
        </>
      )}

      <Dialog open={!!viewingEntry} onClose={() => setViewingEntry(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Entry details</DialogTitle>
        <DialogContent>
          {viewingEntry && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1">{formatDate(viewingEntry.date)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Site
                </Typography>
                <Typography variant="body1">{viewingEntry.site_name}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Task
                </Typography>
                <Typography variant="body1">
                  {viewingEntry.task_name}{' '}
                  <Typography component="span" variant="caption" color="text.secondary">
                    [{viewingEntry.task_key}]
                  </Typography>
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  BOQ Item
                </Typography>
                <Typography variant="body1">{viewingEntry.boq_item_code || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Quantity logged
                </Typography>
                <Typography variant="body1">
                  {Number(viewingEntry.quantity).toLocaleString()} {viewingEntry.task_unit}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Cumulative after this entry
                </Typography>
                <Typography variant="body1">
                  {Number(viewingEntry.cumulative_quantity).toLocaleString()} /{' '}
                  {Number(viewingEntry.planned_quantity).toLocaleString()} {viewingEntry.task_unit}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Submitted by
                </Typography>
                <Typography variant="body1">{viewingEntry.submitted_by_name}</Typography>
              </Grid>

              {viewingTaskSchema.length > 0 && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Subtasks / KPIs
                    </Typography>
                  </Grid>
                  {viewingTaskSchema.map((kpi) => (
                    <Grid key={kpi.key} size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        {kpi.label}
                      </Typography>
                      <Typography variant="body1">
                        {formatKpiValue(viewingEntry.kpi_values?.[kpi.key], kpi.value_type)}
                      </Typography>
                    </Grid>
                  ))}
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Remarks
                </Typography>
                <Typography variant="body1">{viewingEntry.remarks || '—'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingEntry(null)}>Close</Button>
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
