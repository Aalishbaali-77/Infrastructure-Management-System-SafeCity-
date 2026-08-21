'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import KpiCard from '@/components/molecules/KpiCard';
import { useGetSitesQuery } from '@/store/api/siteApi';

export default function ContractorDashboard() {
  const router = useRouter();
  const { data: sitesData } = useGetSitesQuery({ page_size: 200 });
  const sites = sitesData?.data ?? [];

  useEffect(() => {
    document.title = 'Contractor Dashboard | SC-GIMS';
  }, []);

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Contractor Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Assigned Tasks" value={0} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Progress Entries" value={0} color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="On Site Now" value={0} color="info.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="CPI Score" value="—" color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Assigned Sites" value={sites.length} color="info.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Assigned Tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tasks module has no backend API yet.
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, cursor: 'pointer' }} onClick={() => router.push('/field-logs')}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Attendance Today
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Field logs module has no backend API yet.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
