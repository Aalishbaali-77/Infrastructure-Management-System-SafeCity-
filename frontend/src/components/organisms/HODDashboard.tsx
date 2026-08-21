'use client';

import { useEffect, useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { isWithinScope } from '@/utils/scopeFilter';
import { useRouter } from 'next/navigation';
import { useGetBoqsQuery } from '@/store/api/boqApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import KpiCard from '@/components/molecules/KpiCard';
import { DataGrid } from '@mui/x-data-grid';

export default function HODDashboard() {
  const router = useRouter();
  const { provinceIds } = usePermission();
  const { data: boqsData } = useGetBoqsQuery({ page_size: 100 });
  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });

  useEffect(() => {
    document.title = 'HOD Dashboard | SC-GIMS';
  }, []);

  const visibleBOQs = useMemo(() => {
    const projectProvinceById = new Map(
      (projectsData?.data ?? []).map((p) => [p.id, p.province_id])
    );
    return (boqsData?.data ?? []).filter((b) =>
      isWithinScope({ provinceIds, siteIds: [] }, projectProvinceById.get(b.project_id), undefined)
    );
  }, [boqsData, projectsData, provinceIds]);

  const pendingDeviations = 0;
  const pendingIPCs = 0;
  const pendingHoldPoints = 0;
  const pendingBOQs = visibleBOQs.filter((b) => b.status === 'DRAFT' || b.status === 'READY').length;
  const totalPendingApprovals = pendingDeviations + pendingIPCs;

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        HOD Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Pending Approvals" value={totalPendingApprovals} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Open NCRs" value={pendingDeviations} color="error.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="IPCs Awaiting Certification"
            value={pendingIPCs}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="Quality Hold Points Pending"
            value={pendingHoldPoints}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="BOQs Pending Publish" value={pendingBOQs} color="warning.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              NCR Register — Requires Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deviations module has no backend API yet.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              IPC Certification Queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              IPC module has no backend API yet.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Quality Hold Points
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Mandatory inspection gates that must pass before work can proceed to the next stage.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quality hold points module has no backend API yet.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              BOQ Status
            </Typography>
            {visibleBOQs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No BOQs in your scope yet.
              </Typography>
            ) : (
              <DataGrid
                rows={visibleBOQs}
                autoHeight
                pageSizeOptions={[5, 10]}
                disableRowSelectionOnClick
                onRowClick={(params) => router.push(`/boq/${params.row.id}`)}
                sx={{ cursor: 'pointer' }}
                columns={[
                  { field: 'project_name', headerName: 'Project', flex: 1.5 },
                  { field: 'template', headerName: 'Template', flex: 1 },
                  {
                    field: 'version',
                    headerName: 'Version',
                    width: 90,
                    renderCell: ({ row }) => `v${row.version}`,
                  },
                  {
                    field: 'total_amount',
                    headerName: 'Total Amount',
                    width: 150,
                    renderCell: ({ row }) => `PKR ${row.total_amount.toLocaleString()}`,
                  },
                  {
                    field: 'status',
                    headerName: 'Status',
                    width: 120,
                    renderCell: ({ row }) => <Chip label={row.status} size="small" />,
                  },
                ]}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
