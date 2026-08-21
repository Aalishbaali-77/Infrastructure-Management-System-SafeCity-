'use client';

import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { useGetSiteProgressTasksQuery, useGetDailyProgressQuery } from '@/store/api/progressApi';
import { useGetSitesQuery } from '@/store/api/siteApi';
import type { RootState } from '@/store';
import type { KpiValueType, SiteProgressTask } from '@/types/dailyProgress';

function formatKpiValue(value: unknown, type: KpiValueType): string {
  if (value === undefined || value === null || value === '') return '—';
  if (type === 'boolean') return value ? 'done' : 'pending';
  if (type === 'number') {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString() : String(value);
  }
  return String(value);
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}%`;
}

export default function WorkProgressPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterSiteId = searchParams.get('site_id');

  const { data: sitesData, isLoading: loadingSites } = useGetSitesQuery({ page_size: 200 });
  const allSites = sitesData?.data ?? [];

  // Same scoping convention as the log-style Progress Report page:
  // currentUser?.siteIds restricts visibility; empty/undefined = no restriction.
  const scopedSites = useMemo(() => {
    const userSiteIds = currentUser?.siteIds;
    if (!userSiteIds || userSiteIds.length === 0) return allSites;
    return allSites.filter((s) => userSiteIds.includes(s.id));
  }, [allSites, currentUser]);

  // If a site was passed via ?site_id=, narrow to just that site —
  // as long as it's actually within the user's scope.
  const visibleSites = useMemo(() => {
    if (!filterSiteId) return scopedSites;
    return scopedSites.filter((s) => s.id === filterSiteId);
  }, [scopedSites, filterSiteId]);

  const filteredSiteName = useMemo(
    () => (filterSiteId ? scopedSites.find((s) => s.id === filterSiteId)?.name : null),
    [scopedSites, filterSiteId]
  );

  const scopedSiteIds = useMemo(() => new Set(visibleSites.map((s) => s.id)), [visibleSites]);

  const { data: tasksData, isLoading: loadingTasks } = useGetSiteProgressTasksQuery({
    is_active: 'true',
    page_size: 500,
  });
  const allTasks = tasksData?.data ?? [];
  const scopedTasks = useMemo(
    () => allTasks.filter((t) => scopedSiteIds.has(t.site_id)),
    [allTasks, scopedSiteIds]
  );

  const { data: entriesData, isLoading: loadingEntries } = useGetDailyProgressQuery({ page_size: 500 });
  const allEntries = entriesData?.data ?? [];
  const scopedEntries = useMemo(
    () => allEntries.filter((e) => scopedSiteIds.has(e.site_id)),
    [allEntries, scopedSiteIds]
  );

  // Reused verbatim from daily-progress/page.tsx: latest non-empty value per
  // subtask key, per task, across all logged entries (most recent date wins).
  const latestKpiValueByTask = useMemo(() => {
    const sortedByDateDesc = [...scopedEntries].sort((a, b) =>
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
  }, [scopedEntries]);

  const tasksBySite = useMemo(() => {
    const map = new Map<string, SiteProgressTask[]>();
    for (const t of scopedTasks) {
      const list = map.get(t.site_id);
      if (list) list.push(t);
      else map.set(t.site_id, [t]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    }
    return map;
  }, [scopedTasks]);

  const sortedSites = useMemo(
    () => [...visibleSites].sort((a, b) => a.name.localeCompare(b.name)),
    [visibleSites]
  );

  useEffect(() => {
    document.title = 'Work Progress | SC-GIMS';
  }, []);

  const loading = loadingSites || loadingTasks || loadingEntries;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
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
              Work Progress
            </Typography>

          </Box>
        </Stack>
        {filterSiteId && (
          <Button
            size="small"
            startIcon={<CloseIcon />}
            onClick={() => router.push('/daily-progress/completion')}
          >
            Clear filter
          </Button>
        )}
      </Stack>

      {loading ? (
        <PageSkeleton />
      ) : sortedSites.length === 0 ? (
        <Alert severity="info">
          {filterSiteId
            ? 'That site is not in your assigned scope, or does not exist.'
            : 'No sites in your assigned scope.'}
        </Alert>
      ) : (
        <Stack spacing={2}>
          {sortedSites.map((site) => {
            const modules = tasksBySite.get(site.id) ?? [];
            return (
              <Accordion key={site.id} defaultExpanded={sortedSites.length === 1}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {site.name}
                    </Typography>
                    <Chip size="small" label={`${modules.length} module${modules.length === 1 ? '' : 's'}`} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {modules.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No modules configured for this site.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {modules.map((mod) => {
                        const hasSubtasks = mod.kpi_schema.length > 0;
                        const kpiValues = latestKpiValueByTask.get(mod.id);
                        const planned = Number(mod.planned_quantity) || 0;
                        const done = Number(mod.cumulative_quantity) || 0;

                        // Work Progress % formula:
                        // - Modules WITH subtasks (kpi_schema): "recorded coverage" —
                        //   (# subtasks with a latest logged value) / (total subtask count).
                        //   A subtask (ProgressKpiField) carries only a value_type
                        //   (number/string/boolean), not its own planned_quantity, so
                        //   there is no safe per-subtask denominator to build an
                        //   Installed/planned ratio for non-numeric subtasks (e.g. a
                        //   boolean "done" flag). Coverage ratio is well-defined for
                        //   every value_type and only computed when subtask count > 0,
                        //   so it can never divide by zero.
                        // - Modules WITHOUT subtasks: cumulative_quantity / planned_quantity,
                        //   the same calculation already used for the "Site task status"
                        //   progress bars on the main Daily Progress page. Guarded against
                        //   planned_quantity === 0.
                        let progressPct: number | null;
                        if (hasSubtasks) {
                          const recorded = mod.kpi_schema.filter(
                            (kpi) => kpiValues?.get(kpi.key) !== undefined
                          ).length;
                          progressPct = (recorded / mod.kpi_schema.length) * 100;
                        } else {
                          progressPct = planned > 0 ? Math.min(100, (done / planned) * 100) : null;
                        }

                        return (
                          <Accordion key={mod.id} disableGutters>
                            <AccordionSummary expandIcon={hasSubtasks ? <ExpandMoreIcon /> : undefined}>
                              <Stack
                                direction="row"
                                spacing={2}
                                sx={{ width: '100%', alignItems: 'center', flexWrap: 'wrap' }}
                              >
                                <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: 500 }}>
                                  {mod.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Total Qty: {planned.toLocaleString()} {mod.unit}
                                </Typography>
                                {!hasSubtasks && (
                                  <Typography variant="caption" color="text.secondary">
                                    Logged: {done.toLocaleString()} {mod.unit}
                                  </Typography>
                                )}
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color={
                                    progressPct === null ? 'default' : progressPct >= 100 ? 'success' : 'primary'
                                  }
                                  label={`Progress: ${formatPercent(progressPct)}`}
                                />
                              </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                              {!hasSubtasks ? (
                                <>
                                  
                                  <LinearProgress
                                    variant="determinate"
                                    value={progressPct ?? 0}
                                    sx={{ height: 6, borderRadius: 1 }}
                                  />
                                </>
                              ) : (
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Subtask</TableCell>
                                        <TableCell>Latest Value</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {mod.kpi_schema.map((kpi) => (
                                        <TableRow key={kpi.key} hover>
                                          <TableCell>{kpi.label}</TableCell>
                                          <TableCell>
                                            {formatKpiValue(kpiValues?.get(kpi.key), kpi.value_type)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}