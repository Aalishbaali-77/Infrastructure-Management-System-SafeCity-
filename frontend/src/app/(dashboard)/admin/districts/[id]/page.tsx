'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import { useBreadcrumbLabel } from '@/contexts/BreadcrumbContext';
import type { Town } from '@/types/site';
import {
  useCreateTownMutation,
  useDeleteTownMutation,
  useGetDistrictQuery,
  useGetTownsQuery,
  useUpdateTownMutation,
} from '@/store/api/provinceApi';
import { useGetSitesQuery } from '@/store/api/siteApi';

const emptyForm = { name: '', code: '' };

export default function DistrictTownsPage() {
  const params = useParams();
  const router = useRouter();
  const districtId = params.id as string;

  const { data: district, isError: districtError } = useGetDistrictQuery(districtId);
  const { data: townsData } = useGetTownsQuery({ district_id: districtId, page_size: 200 });
  const { data: sitesData } = useGetSitesQuery({ page_size: 500 });

  useBreadcrumbLabel(`/admin/districts/${districtId}`, district?.name);

  const [createTown] = useCreateTownMutation();
  const [updateTown] = useUpdateTownMutation();
  const [deleteTown] = useDeleteTownMutation();

  const townsInDistrict = townsData?.data ?? [];
  const sites = sitesData?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [townToDelete, setTownToDelete] = useState<Town | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = district ? `${district.name} Towns | SC-GIMS` : 'Towns | SC-GIMS';
  }, [district]);

  if (districtError || !district) {
    return (
      <Box>
        <Typography variant="h6">District not found.</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/provinces')}
          sx={{ mt: 2 }}
        >
          Back to Provinces
        </Button>
      </Box>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (town: Town) => {
    setEditingId(town.id);
    setForm({ name: town.name, code: town.code });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateTown({
          id: editingId,
          data: { name: form.name, code: form.code.toUpperCase() },
        }).unwrap();
      } else {
        await createTown({
          name: form.name,
          code: form.code.toUpperCase(),
          district_id: districtId,
        }).unwrap();
      }
      setOpen(false);
    } catch {
      setBlockedMessage('Failed to save town. Please try again.');
    }
  };

  const requestDelete = (town: Town) => {
    const sitesUsingTown = sites.filter((s) => s.town_id === town.id);
    if (sitesUsingTown.length > 0) {
      setBlockedMessage(
        `Cannot delete ${town.name} — still referenced by ${sitesUsingTown.length} site(s). Reassign or remove those sites first.`
      );
      return;
    }
    setBlockedMessage(null);
    setTownToDelete(town);
  };

  const confirmDelete = async () => {
    if (townToDelete) {
      try {
        await deleteTown(townToDelete.id).unwrap();
      } catch {
        setBlockedMessage('Failed to delete town. Please try again.');
      }
    }
    setTownToDelete(null);
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/admin/provinces/${district.province_id}`)}
        sx={{ mb: 2 }}
      >
        Back to {district.province_name ?? 'Province'} Districts
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h5" component="h1">
          Towns
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Town
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click a town to view its sites.
      </Typography>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      {townsInDistrict.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No towns added yet for {district.name}.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60}>S.No</TableCell>
                <TableCell>Town name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Sites</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {townsInDistrict.map((town, index) => {
                const siteCount = sites.filter((s) => s.town_id === town.id).length;
                return (
                  <TableRow key={town.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link
                        component="button"
                        onClick={() => router.push(`/admin/towns/${town.id}`)}
                        sx={{ fontWeight: 600, textAlign: 'left' }}
                      >
                        {town.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip label={town.code} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {siteCount} site{siteCount === 1 ? '' : 's'}
                    </TableCell>
                    <TableCell align="right">
                      <RowActionsMenu
                        actions={[
                          {
                            key: 'view',
                            label: 'View sites',
                            icon: <VisibilityIcon fontSize="small" />,
                            onClick: () => router.push(`/admin/towns/${town.id}`),
                          },
                          {
                            key: 'edit',
                            label: 'Edit',
                            icon: <EditIcon fontSize="small" />,
                            onClick: () => openEdit(town),
                          },
                          {
                            key: 'delete',
                            label: 'Delete',
                            icon: <DeleteIcon fontSize="small" />,
                            destructive: true,
                            dividerBefore: true,
                            onClick: () => requestDelete(town),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Town' : 'Add Town'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Town Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Code (e.g. KHI)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.code}>
            {editingId ? 'Save Changes' : 'Add Town'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!townToDelete} onClose={() => setTownToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Town</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete <strong>{townToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setTownToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}