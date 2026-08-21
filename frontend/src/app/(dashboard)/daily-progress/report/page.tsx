'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { useGetDailyProgressQuery, useGetSiteProgressTasksQuery } from '@/store/api/progressApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { formatDate } from '@/utils/formatDate';
import type { RootState } from '@/store';
import type { DailyProgressEntry, KpiValueType } from '@/types/dailyProgress';

function escapeCsvValue(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatKpiValue(value: unknown, type: KpiValueType): string {
  if (value === undefined || value === null || value === '') return '—';
  if (type === 'boolean') return value ? 'done' : 'pending';
  if (type === 'number') {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString() : String(value);
  }
  return String(value);
}

// One row per subtask (or one row if the task has no subtasks) — used by
// both the on-screen table and the CSV so the two stay identical.
interface DisplayRow {
  entryId: string;
  isFirstRowOfEntry: boolean;
  date: string;
  siteName: string;
  boqItemCode: string | null;
  taskName: string;
  taskKey: string;
  subtaskLabel: string | null;
  subtaskValue: string | null;
  quantity: number;
  unit: string;
  submittedBy: string;
  remarks: string;
}

export default function ProgressReportPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [fromDate, setFromDate] = useState(() => isoDaysAgo(7));
  const [toDate, setToDate] = useState(() => isoDaysAgo(0));

  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });
  const allProjects = projectsData?.data ?? [];

  const { data: sitesData } = useGetSitesQuery({
    project_id: projectId || undefined,
    page_size: 200,
  });
  const allSites = sitesData?.data ?? [];

  const projects = useMemo(() => {
    const userSiteIds = currentUser?.siteIds;
    if (!userSiteIds || userSiteIds.length === 0) return allProjects;
    const allowedProjectIds = new Set(
      allSites.filter((s) => userSiteIds.includes(s.id)).map((s) => s.project_id)
    );
    return allProjects.filter((p) => allowedProjectIds.has(p.id));
  }, [allProjects, allSites, currentUser]);

  const sites = useMemo(() => {
    const userSiteIds = currentUser?.siteIds;
    if (!userSiteIds || userSiteIds.length === 0) return allSites;
    return allSites.filter((s) => userSiteIds.includes(s.id));
  }, [allSites, currentUser]);

  const restrictedSiteIds = useMemo(() => {
    const userSiteIds = currentUser?.siteIds;
    if (!userSiteIds || userSiteIds.length === 0) return null;
    return userSiteIds;
  }, [currentUser]);

  const { data: entriesData, isFetching } = useGetDailyProgressQuery({
    site_id: siteId || undefined,
    date_from: fromDate,
    date_to: toDate,
    page_size: 500,
  });

  const { data: tasksData } = useGetSiteProgressTasksQuery({ page_size: 500 });
  const taskById = useMemo(() => {
    const allTasks = tasksData?.data ?? [];
    const map = new Map<string, (typeof allTasks)[number]>();
    for (const t of allTasks) map.set(t.id, t);
    return map;
  }, [tasksData]);

  useEffect(() => {
    document.title = 'Progress Report | SC-GIMS';
  }, []);

  const allEntries = entriesData?.data ?? [];

  const scopedEntries = useMemo(() => {
    if (!restrictedSiteIds) return allEntries;
    return allEntries.filter((e) => restrictedSiteIds.includes(e.site_id));
  }, [allEntries, restrictedSiteIds]);

  const entries = useMemo(
    () =>
      projectId && !siteId
        ? scopedEntries.filter((e) => e.project_id === projectId)
        : scopedEntries,
    [scopedEntries, projectId, siteId]
  );

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries]
  );

  // Expand each entry into one or more display rows — one per subtask,
  // or a single row if the task has no subtasks. Shared with CSV export.
  const displayRows: DisplayRow[] = useMemo(() => {
    const out: DisplayRow[] = [];
    for (const e of sortedEntries) {
      const task = taskById.get(e.site_task_id);
      if (task && task.kpi_schema.length > 0) {
        task.kpi_schema.forEach((kpi, i) => {
          out.push({
            entryId: e.id,
            isFirstRowOfEntry: i === 0,
            date: e.date,
            siteName: e.site_name,
            boqItemCode: e.boq_item_code,
            taskName: e.task_name,
            taskKey: e.task_key,
            subtaskLabel: kpi.label,
            subtaskValue: formatKpiValue(e.kpi_values?.[kpi.key], kpi.value_type),
            quantity: Number(e.quantity),
            unit: e.task_unit,
            submittedBy: e.submitted_by_name,
            remarks: e.remarks || '',
          });
        });
      } else {
        out.push({
          entryId: e.id,
          isFirstRowOfEntry: true,
          date: e.date,
          siteName: e.site_name,
          boqItemCode: e.boq_item_code,
          taskName: e.task_name,
          taskKey: e.task_key,
          subtaskLabel: null,
          subtaskValue: null,
          quantity: Number(e.quantity),
          unit: e.task_unit,
          submittedBy: e.submitted_by_name,
          remarks: e.remarks || '',
        });
      }
    }
    return out;
  }, [sortedEntries, taskById]);

  interface SummaryRow {
    key: string;
    taskName: string;
    taskKey: string;
    boqItemCode: string | null;
    siteName: string;
    totalQuantity: number;
    unit: string;
    count: number;
    lastDate: string;
    latestKpiValues: Map<string, unknown>;
  }

  const summaryRows: SummaryRow[] = useMemo(() => {
    const byTask = new Map<string, SummaryRow>();
    const sortedAsc = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    for (const e of sortedAsc) {
      const key = e.site_task_id || `${e.site_id}-${e.task_name}`;
      const qty = Number(e.quantity) || 0;
      const existing = byTask.get(key);
      if (existing) {
        existing.totalQuantity += qty;
        existing.count += 1;
        if (e.date >= existing.lastDate) existing.lastDate = e.date;
        for (const [k, v] of Object.entries(e.kpi_values ?? {})) {
          if (v === undefined || v === null || v === '') continue;
          existing.latestKpiValues.set(k, v);
        }
      } else {
        const latestKpiValues = new Map<string, unknown>();
        for (const [k, v] of Object.entries(e.kpi_values ?? {})) {
          if (v === undefined || v === null || v === '') continue;
          latestKpiValues.set(k, v);
        }
        byTask.set(key, {
          key,
          taskName: e.task_name,
          taskKey: e.task_key,
          boqItemCode: e.boq_item_code,
          siteName: e.site_name,
          totalQuantity: qty,
          unit: e.task_unit,
          count: 1,
          lastDate: e.date,
          latestKpiValues,
        });
      }
    }
    return Array.from(byTask.values()).sort(
      (a, b) => a.siteName.localeCompare(b.siteName) || a.taskName.localeCompare(b.taskName)
    );
  }, [entries]);

  const handleDownloadCsv = () => {
    const headers = [
      'Date',
      'Site',
      'BOQ Item',
      'Module / Task',
      'Subtask',
      'Subtask Value',
      'Qty',
      'Unit',
      'Submitted by',
      'Remarks',
    ];
    const rows = displayRows.map((r) => [
      r.isFirstRowOfEntry ? r.date : '',
      r.isFirstRowOfEntry ? r.siteName : '',
      r.isFirstRowOfEntry ? r.boqItemCode || '' : '',
      r.isFirstRowOfEntry ? r.taskName : '',
      r.subtaskLabel || '',
      r.subtaskValue || '',
      r.isFirstRowOfEntry ? r.quantity : '',
      r.isFirstRowOfEntry ? r.unit : '',
      r.isFirstRowOfEntry ? r.submittedBy : '',
      r.isFirstRowOfEntry ? r.remarks : '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `progress-report-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            onClick={() => router.push('/daily-progress')}
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
              Progress Report
            </Typography>
           
          </Box>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadCsv}
          disabled={sortedEntries.length === 0}
        >
          Download CSV
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            label="Project"
            size="small"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setSiteId('');
            }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All projects</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Site"
            size="small"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All sites</MenuItem>
            {sites.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="From"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="To"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Paper>

      {isFetching ? (
        <PageSkeleton />
      ) : sortedEntries.length === 0 ? (
        <Alert severity="info">No progress entries found for this period.</Alert>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Summary
          </Typography>
          <Paper sx={{ mb: 3, overflowX: 'auto' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Site</TableCell>
                    <TableCell>BOQ Item</TableCell>
                    <TableCell>Module / Task</TableCell>
                    <TableCell align="right">Total Quantity</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right"># Entries</TableCell>
                    <TableCell>Last Entry</TableCell>
                    <TableCell>Subtasks / KPIs</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryRows.map((row) => {
                    const task = taskById.get(row.key);
                    return (
                      <TableRow key={row.key} hover>
                        <TableCell>{row.siteName}</TableCell>
                        <TableCell>{row.boqItemCode || '—'}</TableCell>
                        <TableCell>
                          {row.taskName}{' '}
                          <Typography component="span" variant="caption" color="text.secondary">
                            [{row.taskKey}]
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{row.totalQuantity.toLocaleString()}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell>{formatDate(row.lastDate)}</TableCell>
                        <TableCell>
                          {task && task.kpi_schema.length > 0
                            ? task.kpi_schema
                                .map(
                                  (kpi) =>
                                    `${kpi.label}: ${formatKpiValue(
                                      row.latestKpiValues.get(kpi.key),
                                      kpi.value_type
                                    )}`
                                )
                                .join(' · ')
                            : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Typography variant="h6" sx={{ mb: 1 }}>
            Entries
          </Typography>
          <Paper sx={{ overflowX: 'auto' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>BOQ Item</TableCell>
                    <TableCell>Module / Task</TableCell>
                    <TableCell>Subtask</TableCell>
                    <TableCell>Subtask Value</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Submitted by</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayRows.map((r, i) => (
                    <TableRow key={`${r.entryId}-${i}`} hover>
                      <TableCell>{r.isFirstRowOfEntry ? formatDate(r.date) : ''}</TableCell>
                      <TableCell>{r.isFirstRowOfEntry ? r.siteName : ''}</TableCell>
                      <TableCell>{r.isFirstRowOfEntry ? r.boqItemCode || '—' : ''}</TableCell>
                      <TableCell>
                        {r.isFirstRowOfEntry ? (
                          <>
                            {r.taskName}{' '}
                            <Typography component="span" variant="caption" color="text.secondary">
                              [{r.taskKey}]
                            </Typography>
                          </>
                        ) : (
                          ''
                        )}
                      </TableCell>
                      <TableCell>{r.subtaskLabel ?? '—'}</TableCell>
                      <TableCell>{r.subtaskValue ?? '—'}</TableCell>
                      <TableCell align="right">
                        {r.isFirstRowOfEntry ? r.quantity.toLocaleString() : ''}
                      </TableCell>
                      <TableCell>{r.isFirstRowOfEntry ? r.unit : ''}</TableCell>
                      <TableCell>{r.isFirstRowOfEntry ? r.submittedBy : ''}</TableCell>
                      <TableCell>{r.isFirstRowOfEntry ? r.remarks || '—' : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}