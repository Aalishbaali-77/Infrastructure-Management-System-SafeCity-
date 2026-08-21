'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import KpiCard from '@/components/molecules/KpiCard';
import { useGetSitesQuery } from '@/store/api/siteApi';

export default function QADashboard() {
  const router = useRouter();
  const { data: sitesData } = useGetSitesQuery({ page_size: 200 });
  const sites = sitesData?.data ?? [];

  useEffect(() => {
    document.title = 'QA Inspector Dashboard | SC-GIMS';
  }, []);

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        QA Inspector Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Tests in Pipeline" value={0} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Witness Tests Pending" value={0} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Checklist Items Pending" value="0/0" color="info.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Open Snags" value={0} color="error.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Sites in Scope" value={sites.length} color="info.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, cursor: 'pointer' }} onClick={() => router.push('/acceptance-tests')}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              T&C Pipeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Acceptance tests module has no backend API yet.
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, cursor: 'pointer' }} onClick={() => router.push('/snag-list')}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Snag List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Snag list module has no backend API yet.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
