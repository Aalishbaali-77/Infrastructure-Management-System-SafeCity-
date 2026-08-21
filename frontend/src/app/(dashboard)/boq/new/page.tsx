'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useCreateBoqMutation } from '@/store/api/boqApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useCrudPermission } from '@/hooks/useCrudPermission';

const schema = z.object({
  project_id: z.string().uuid('Select a project'),
  template: z.string().optional(),
  version: z.coerce.number().int().min(1),
});

type FormValues = z.output<typeof schema>;

export default function CreateBOQPage() {
  const router = useRouter();
  const { canCreate } = useCrudPermission('/boq');
  const [createBoq, { isLoading, error }] = useCreateBoqMutation();
  const { data: projectsData, isLoading: loadingProjects } = useGetProjectsQuery({
    page_size: 100,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { project_id: '', template: '', version: 1 },
  });

  const projects = projectsData?.data ?? [];

  useEffect(() => {
    document.title = 'Create BOQ | SC-GIMS';
  }, []);

  if (!canCreate) {
    return (
      <Alert severity="warning">
        You do not have permission to create BOQs.
      </Alert>
    );
  }

  const onSubmit = async (values: FormValues) => {
    const boq = await createBoq({
      project_id: values.project_id,
      template: values.template || undefined,
      version: values.version,
    }).unwrap();
    router.push(`/boq/${boq.id}`);
  };

  const apiError = (error as { data?: { detail?: string } })?.data?.detail;

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/boq')} sx={{ mb: 2 }}>
        Back to BOQ
      </Button>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Create BOQ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a project. You can add spreadsheet line items on the next screen.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            {apiError && <Alert severity="error">{String(apiError)}</Alert>}

            <Controller
              name="project_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Project"
                  disabled={loadingProjects}
                  error={!!errors.project_id}
                  helperText={errors.project_id?.message}
                >
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="template"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Template code (optional)" />
              )}
            />

            <Controller
              name="version"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label="Version"
                  error={!!errors.version}
                  helperText={errors.version?.message}
                />
              )}
            />

            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => router.push('/boq')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? 'Creating…' : 'Create BOQ'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
