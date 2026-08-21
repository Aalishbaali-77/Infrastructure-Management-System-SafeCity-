'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import KpiCard from '@/components/molecules/KpiCard';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetBoqsQuery } from '@/store/api/boqApi';

export default function ExecutiveDashboard() {
  const router = useRouter();
  const { data: sitesData } = useGetSitesQuery({ page_size: 200 });
  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });
  const { data: boqsData } = useGetBoqsQuery({ page_size: 100 });

  const sites = sitesData?.data ?? [];
  const projects = projectsData?.data ?? [];
  const boqs = boqsData?.data ?? [];

  useEffect(() => {
    document.title = 'Dashboard | SC-GIMS';
  }, []);

  const activeSites = sites.filter((s) => s.status === 'ACTIVE').length;
  const delayedSites = sites.filter((s) => s.status === 'ON_HOLD').length;
  const overallCompletionPct = sites.length
    ? Math.round((activeSites / sites.length) * 100)
    : 0;

  const kpis = [
    { label: 'Total Sites', value: sites.length, color: 'primary.main' },
    { label: 'Active Projects', value: projects.filter((p) => p.status === 'ACTIVE').length, color: 'success.main' },
    { label: 'Overall Completion', value: `${overallCompletionPct}%`, color: 'info.main' },
    { label: 'Delayed Sites', value: delayedSites, color: 'error.main' },
    { label: 'Pending Approvals', value: 0, color: 'warning.main' },
  ];

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Executive Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 6, md: 12 / 5 }}>
            <KpiCard label={kpi.label} value={kpi.value} color={kpi.color} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Projects ({projects.length})
            </Typography>
            {projects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No projects loaded yet.
              </Typography>
            ) : (
              projects.slice(0, 5).map((p) => (
                <Typography key={p.id} variant="body2" sx={{ mb: 0.5 }}>
                  {p.name} — {p.status}
                </Typography>
              ))
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              BOQs ({boqs.length})
            </Typography>
            {boqs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No BOQs loaded yet.
              </Typography>
            ) : (
              boqs.slice(0, 5).map((b) => (
                <Typography
                  key={b.id}
                  variant="body2"
                  sx={{ mb: 0.5, cursor: 'pointer', color: 'primary.main' }}
                  onClick={() => router.push(`/boq/${b.id}`)}
                >
                  {b.project_name} — v{b.version} ({b.status})
                </Typography>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
