'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import KpiCard from '@/components/molecules/KpiCard';
import { useGetSitesQuery } from '@/store/api/siteApi';

export default function AuditorDashboard() {
  const { data: sitesData } = useGetSitesQuery({ page_size: 200 });
  const sites = sitesData?.data ?? [];

  useEffect(() => {
    document.title = 'Auditor Dashboard | SC-GIMS';
  }, []);

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Auditor Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <KpiCard label="Total Logged Actions" value={0} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <KpiCard label="Distinct Action Types" value={0} color="info.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <KpiCard label="Sites Covered" value={sites.length} color="success.main" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Audit Log
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Audit log module has no backend API yet.
        </Typography>
      </Paper>
    </Box>
  );
}
