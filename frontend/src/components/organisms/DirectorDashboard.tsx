'use client';

import { useEffect, useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { isWithinScope } from '@/utils/scopeFilter';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import KpiCard from '@/components/molecules/KpiCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { useGetProvincesQuery } from '@/store/api/provinceApi';

export default function DirectorDashboard() {
  const { provinceIds, siteIds } = usePermission();
  const { data: sitesData } = useGetSitesQuery({ page_size: 200 });
  const { data: provincesData } = useGetProvincesQuery({ page_size: 100 });

  const sites = sitesData?.data ?? [];
  const provinces = provincesData?.data ?? [];

  useEffect(() => {
    document.title = 'Director Dashboard | SC-GIMS';
  }, []);

  const visibleSites = useMemo(
    () =>
      sites.filter((site) =>
        isWithinScope({ provinceIds, siteIds }, site.province_id, site.id)
      ),
    [sites, provinceIds, siteIds]
  );

  const pendingDeviations = 0;
  const pendingIPCs = 0;
  const totalPendingApprovals = pendingDeviations + pendingIPCs;
  const delayedSites = visibleSites.filter((s) => s.status === 'ON_HOLD').length;

  const provinceStats = provinces
    .map((province) => {
      const sitesInProvince = visibleSites.filter((s) => s.province_id === province.id);
      return {
        province: province.name,
        sites: sitesInProvince.length,
        active: sitesInProvince.filter((s) => s.status === 'ACTIVE').length,
        onHold: sitesInProvince.filter((s) => s.status === 'ON_HOLD').length,
      };
    })
    .filter((p) => p.sites > 0);

  const overallCompletionPct = visibleSites.length
    ? Math.round(
        (visibleSites.filter((s) => s.status === 'ACTIVE').length / visibleSites.length) * 100
      )
    : 0;

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Director Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <KpiCard label="Total Sites" value={visibleSites.length} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <KpiCard
            label="Active Work Packages"
            value={visibleSites.filter((s) => s.status === 'ACTIVE').length}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <KpiCard
            label="Overall Completion"
            value={`${overallCompletionPct}%`}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <KpiCard label="Delayed Sites" value={delayedSites} color="error.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <KpiCard label="Pending Approvals" value={totalPendingApprovals} color="warning.main" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Province Comparison
        </Typography>
        {provinceStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={provinceStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="province" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" fill="#2e7d32" name="Active Sites" />
              <Bar dataKey="onHold" fill="#d32f2f" name="On Hold" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No site data available for your assigned scope.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
