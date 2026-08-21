'use client';

import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StatusChip from '@/components/molecules/StatusChip';
import { useBreadcrumbLabel } from '@/contexts/BreadcrumbContext';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { useGetProjectQuery } from '@/store/api/projectApi';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading, isError } = useGetProjectQuery(projectId);
  useBreadcrumbLabel(`/projects/${projectId}`, project?.name);

  if (isLoading) return <PageSkeleton />;

  if (isError || !project) {
    return (
      <Box>
        <Typography variant="h6">Project not found.</Typography>
        <Button onClick={() => router.push('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/projects')} sx={{ mb: 2 }}>
        Back to Projects
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5" component="h1">
          {project.name}
        </Typography>
        <StatusChip status={project.status} />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Province
                </Typography>
                <Typography>{project.province}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Program Code
                </Typography>
                <Typography>{project.program_code || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Budget
                </Typography>
                <Typography>
                  {project.budget ? `PKR ${project.budget.toLocaleString()}` : '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Start Date
                </Typography>
                <Typography>{project.start_date}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  End Date
                </Typography>
                <Typography>{project.end_date || '—'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
