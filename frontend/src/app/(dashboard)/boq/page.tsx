'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DataTable from '@/components/organisms/DataTable';
import StatusChip from '@/components/molecules/StatusChip';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import { formatDate } from '@/utils/formatDate';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useDeleteBoqMutation, useGetBoqsQuery, useUpdateBoqMutation } from '@/store/api/boqApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import type { BOQ } from '@/types/boq';

interface ProjectGroup {
  projectId: string;
  projectName: string;
  boqs: BOQ[];
  totalAmount: number;
}

export default function BOQListPage() {
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = useCrudPermission('/boq');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [boqToDelete, setBoqToDelete] = useState<BOQ | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingBoq, setEditingBoq] = useState<BOQ | null>(null);
  const [editForm, setEditForm] = useState({ template: '', version: '' });
  const [editError, setEditError] = useState<string | null>(null);

  const {
    data: boqData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetBoqsQuery({
    page_size: 100,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(projectFilter ? { project_id: projectFilter } : {}),
  });

  const { data: projectsData } = useGetProjectsQuery({ page_size: 100 });
  const [deleteBoq, { isLoading: deleting }] = useDeleteBoqMutation();
  const [updateBoq, { isLoading: updating }] = useUpdateBoqMutation();

  useEffect(() => {
    document.title = 'BOQ | SC-GIMS';
  }, []);

  const boqs = boqData?.data ?? [];
  const projects = projectsData?.data ?? [];

  const projectGroups: ProjectGroup[] = useMemo(() => {
    const byProject = new Map<string, ProjectGroup>();
    for (const boq of boqs) {
      const key = String(boq.project_id);
      const existing = byProject.get(key) ?? {
        projectId: key,
        projectName: boq.project_name,
        boqs: [],
        totalAmount: 0,
      };
      existing.boqs.push(boq);
      existing.totalAmount += Number(boq.total_amount || 0);
      byProject.set(key, existing);
    }
    const groups = Array.from(byProject.values());
    groups.forEach((g) => {
      g.boqs = [...g.boqs].sort((a, b) => b.version - a.version);
    });
    groups.sort((a, b) => a.projectName.localeCompare(b.projectName));
    return groups;
  }, [boqs]);

  const confirmDelete = async () => {
    if (!boqToDelete) return;
    try {
      await deleteBoq(boqToDelete.id).unwrap();
      setBoqToDelete(null);
    } catch (e) {
      setDeleteError(
        (e as { data?: { detail?: string } })?.data?.detail || 'Failed to delete BOQ.'
      );
      setBoqToDelete(null);
    }
  };

  const openEdit = (boq: BOQ) => {
    setEditingBoq(boq);
    setEditForm({ template: boq.template ?? '', version: String(boq.version) });
    setEditError(null);
  };

  const confirmEdit = async () => {
    if (!editingBoq) return;
    try {
      await updateBoq({
        id: editingBoq.id,
        data: { template: editForm.template || undefined, version: Number(editForm.version) },
      }).unwrap();
      setEditingBoq(null);
    } catch (e) {
      setEditError((e as { data?: { detail?: string } })?.data?.detail || 'Failed to update BOQ.');
    }
  };

  const openDetail = (boq: BOQ) => router.push(`/boq/${boq.id}`);

  if (isLoading) return <PageSkeleton />;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Box>
          <Typography variant="h5" component="h1">
            Bill of Quantities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Open a BOQ to view the landed-cost spreadsheet (PC1 → TotalDDP PKR), import Excel, and
            publish.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/boq/new')}
            >
              Create BOQ
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            label="Project"
            size="small"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All projects</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {['DRAFT', 'READY', 'PUBLISHED', 'UPLOADING', 'PARSING'].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as { data?: { detail?: string } })?.data?.detail ||
            'Failed to load BOQs. Check API connection and your permissions.'}
        </Alert>
      )}

      {deleteError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}

      {editError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditError(null)}>
          {editError}
        </Alert>
      )}

      {!isError && projectGroups.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No BOQs yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a BOQ for a project to start tracking landed costs and DDP.
          </Typography>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/boq/new')}
            >
              Create first BOQ
            </Button>
          )}
        </Paper>
      ) : (
        projectGroups.map(({ projectId, projectName, boqs: groupBoqs, totalAmount }) => (
          <Paper key={projectId} sx={{ mb: 3, p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5,
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="h6">
                {projectName} <Chip label={groupBoqs.length} size="small" sx={{ ml: 1 }} />
              </Typography>
              <Chip
                label={`PKR ${Number(totalAmount).toLocaleString()}`}
                color="primary"
                variant="outlined"
              />
            </Box>

            <DataTable
              rows={groupBoqs}
              onRowClick={(params: { row: BOQ }) => openDetail(params.row)}
              sx={{
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
              }}
              columns={[
                {
                  field: 'template',
                  headerName: 'Template',
                  flex: 1,
                  renderCell: ({ row }: { row: BOQ }) => row.template || '—',
                },
                {
                  field: 'version',
                  headerName: 'Version',
                  flex: 0.5,
                  renderCell: ({ row }: { row: BOQ }) => `v${row.version}`,
                },
                { field: 'items_count', headerName: 'Items', flex: 0.5 },
                {
                  field: 'total_amount',
                  headerName: 'TotalDDP PKR',
                  flex: 1,
                  renderCell: ({ row }: { row: BOQ }) =>
                    `PKR ${Number(row.total_amount || 0).toLocaleString()}`,
                },
                {
                  field: 'status',
                  headerName: 'Status',
                  flex: 0.8,
                  renderCell: ({ row }: { row: BOQ }) => <StatusChip status={row.status} />,
                },
                {
                  field: 'updated_at',
                  headerName: 'Last Updated',
                  flex: 1,
                  renderCell: ({ row }: { row: BOQ }) => formatDate(row.updated_at),
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
                  renderCell: ({ row }: { row: BOQ }) => (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <RowActionsMenu
                        actions={[
                          ...(canUpdate
                            ? [
                                {
                                  key: 'edit',
                                  label: 'Edit',
                                  icon: <EditIcon fontSize="small" />,
                                  onClick: () => openEdit(row),
                                },
                              ]
                            : []),
                          {
                            key: 'variance',
                            label: 'View variance',
                            icon: <BarChartIcon fontSize="small" />,
                            onClick: () => router.push(`/boq/${row.id}/variance`),
                          },
                          ...(canDelete
                            ? [
                                {
                                  key: 'delete',
                                  label: 'Delete',
                                  icon: <DeleteIcon fontSize="small" />,
                                  destructive: true,
                                  dividerBefore: true,
                                  onClick: () => setBoqToDelete(row),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </Box>
                  ),
                },
              ]}
              rowCount={groupBoqs.length}
              paginationModel={{ page: 0, pageSize: 10 }}
              onPaginationModelChange={() => {}}
            />
          </Paper>
        ))
      )}

      <Dialog open={!!boqToDelete} onClose={() => setBoqToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete BOQ</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this BOQ (v{boqToDelete?.version})? This will also
            delete all its line items, and unlink any site tasks that reference them. This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setBoqToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBoq} onClose={() => setEditingBoq(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit BOQ</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, mb: 2 }}>
            <TextField
              label="Template code"
              value={editForm.template}
              onChange={(e) => setEditForm((f) => ({ ...f, template: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Version"
              type="number"
              slotProps={{ htmlInput: { min: 1 } }}
              value={editForm.version}
              onChange={(e) => setEditForm((f) => ({ ...f, version: e.target.value }))}
              fullWidth
            />
          </Stack>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setEditingBoq(null)} disabled={updating}>
              Cancel
            </Button>
            <Button variant="contained" onClick={confirmEdit} disabled={updating}>
              {updating ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}