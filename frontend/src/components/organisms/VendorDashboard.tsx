'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import KpiCard from '@/components/molecules/KpiCard';
import { useGetSitesQuery } from '@/store/api/siteApi';

export default function VendorDashboard() {
  const { data: sitesData } = useGetSitesQuery({ page_size: 200 });
  const sites = sitesData?.data ?? [];

  useEffect(() => {
    document.title = 'Vendor Dashboard | SC-GIMS';
  }, []);

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Vendor Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <KpiCard label="Total Deliveries" value={0} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <KpiCard label="Pending Confirmation" value={0} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <KpiCard label="Sites Served" value={sites.length} color="success.main" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Delivery Confirmations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Deliveries module has no backend API yet.
        </Typography>
      </Paper>
    </Box>
  );
}
