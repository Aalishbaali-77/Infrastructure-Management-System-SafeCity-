'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProjectForm from '@/features/projects/ProjectForm';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useCreateProjectMutation } from '@/store/api/projectApi';

export default function NewProjectPage() {
  const router = useRouter();
  const { canCreate } = useCrudPermission('/projects');
  const [createProject, { isLoading, error }] = useCreateProjectMutation();

  useEffect(() => {
    document.title = 'New Project | SC-GIMS';
  }, []);

  if (!canCreate) {
    return <Alert severity="warning">You do not have permission to create projects.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/projects')} sx={{ mb: 2 }}>
        Back
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        New project
      </Typography>
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as { data?: { detail?: string } })?.data?.detail || 'Create failed'}
          </Alert>
        )}
        <ProjectForm
          isSubmitting={isLoading}
          onCancel={() => router.push('/projects')}
          onSubmit={async (data) => {
            const project = await createProject({ ...data, status: 'PLANNED' }).unwrap();
            router.push(`/projects/${project.id}`);
          }}
        />
      </Paper>
    </Box>
  );
}
