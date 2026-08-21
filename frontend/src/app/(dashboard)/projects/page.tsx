'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StatusChip from '@/components/molecules/StatusChip';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import ProjectForm from '@/features/projects/ProjectForm';
import DataTable from '@/components/organisms/DataTable';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import { formatDate } from '@/utils/formatDate';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { usePermission } from '@/hooks/usePermission';
import { isWithinScope } from '@/utils/scopeFilter';
import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from '@/store/api/projectApi';
import { useGetSitesQuery } from '@/store/api/siteApi';
import type { CreateProjectDto, Project } from '@/types/project';

export default function ProjectsPage() {
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = useCrudPermission('/projects');
  const { provinceIds } = usePermission();
  const { data, isLoading, isError, error, refetch } = useGetProjectsQuery({ page_size: 100 });
  const { data: sitesData } = useGetSitesQuery({ page_size: 200 });
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();

  const [editing, setEditing] = useState<Project | null>(null);
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Projects | SC-GIMS';
  }, []);

  const projects = (data?.data ?? []).filter((p) =>
    isWithinScope({ provinceIds, siteIds: [] }, p.province_id, undefined)
  );
  const sites = sitesData?.data ?? [];

  if (isLoading) return <PageSkeleton />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Typography variant="h5">Projects</Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/projects/new')}>
            New project
          </Button>
        )}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as { data?: { detail?: string } })?.data?.detail || 'Failed to load projects'}
        </Alert>
      )}
      {blocked && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setBlocked(null)}>
          {blocked}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <DataTable
          rows={projects}
          columns={[
            { field: 'name', headerName: 'Name', flex: 1.5 },
            { field: 'province', headerName: 'Province', flex: 1 },
            { field: 'program_code', headerName: 'Program', flex: 1 },
            {
              field: 'status',
              headerName: 'Status',
              flex: 0.8,
              renderCell: ({ row }: { row: Project }) => <StatusChip status={row.status} />,
            },
            {
              field: 'start_date',
              headerName: 'Start',
              flex: 0.8,
              renderCell: ({ row }: { row: Project }) => formatDate(row.start_date),
            },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 72,
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              align: 'center',
              headerAlign: 'center',
              renderCell: ({ row }: { row: Project }) => (
                <RowActionsMenu
                  actions={[
                    {
                      key: 'view',
                      label: 'View',
                      icon: <VisibilityIcon fontSize="small" />,
                      onClick: () => router.push(`/projects/${row.id}`),
                    },
                    ...(canUpdate
                      ? [
                          {
                            key: 'edit',
                            label: 'Edit',
                            icon: <EditIcon fontSize="small" />,
                            onClick: () => setEditing(row),
                          },
                        ]
                      : []),
                    ...(canDelete
                      ? [
                          {
                            key: 'delete',
                            label: 'Delete',
                            icon: <DeleteIcon fontSize="small" />,
                            destructive: true,
                            dividerBefore: true,
                            onClick: () => {
                              const count = sites.filter(
                                (s) => String(s.project_id) === String(row.id)
                              ).length;
                              if (count > 0) {
                                setBlocked(`Cannot delete — ${count} site(s) still linked.`);
                                return;
                              }
                              setToDelete(row);
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              ),
            },
          ]}
          rowCount={projects.length}
          paginationModel={{ page: 0, pageSize: 10 }}
          onPaginationModelChange={() => {}}
        />
      </Paper>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit project</DialogTitle>
        <DialogContent>
          {editing && (
            <ProjectForm
              isEditing
              isSubmitting={updating}
              defaultValues={{
                name: editing.name,
                province_id: editing.province_id ?? '',
                program_code: editing.program_code ?? '',
                start_date: editing.start_date,
                end_date: editing.end_date ?? '',
                budget: editing.budget != null ? String(editing.budget) : '',
              }}
              onCancel={() => setEditing(null)}
              onSubmit={async (payload: CreateProjectDto) => {
                await updateProject({ id: editing.id, data: payload }).unwrap();
                setEditing(null);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          <Typography>Delete {toDelete?.name}? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleting}
            onClick={async () => {
              if (!toDelete) return;
              await deleteProject(toDelete.id).unwrap();
              setToDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
