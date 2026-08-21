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
import type { District } from '@/types/site';
import {
  useCreateDistrictMutation,
  useDeleteDistrictMutation,
  useGetDistrictsQuery,
  useGetProvinceQuery,
  useGetTownsQuery,
  useUpdateDistrictMutation,
} from '@/store/api/provinceApi';

const emptyForm = { name: '', code: '' };

export default function ProvinceDistrictsPage() {
  const params = useParams();
  const router = useRouter();
  const provinceId = params.id as string;

  const { data: province, isError: provinceError } = useGetProvinceQuery(provinceId);
  const { data: districtsData } = useGetDistrictsQuery({ province_id: provinceId, page_size: 200 });
  const { data: townsData } = useGetTownsQuery({ province_id: provinceId, page_size: 500 });

  useBreadcrumbLabel(`/admin/provinces/${provinceId}`, province?.name);

  const [createDistrict] = useCreateDistrictMutation();
  const [updateDistrict] = useUpdateDistrictMutation();
  const [deleteDistrict] = useDeleteDistrictMutation();

  const districtsInProvince = districtsData?.data ?? [];
  const towns = townsData?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [districtToDelete, setDistrictToDelete] = useState<District | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = province ? `${province.name} Districts | SC-GIMS` : 'Districts | SC-GIMS';
  }, [province]);

  if (provinceError || !province) {
    return (
      <Box>
        <Typography variant="h6">Province not found.</Typography>
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

  const openEdit = (district: District) => {
    setEditingId(district.id);
    setForm({ name: district.name, code: district.code });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDistrict({
          id: editingId,
          data: { name: form.name, code: form.code.toUpperCase() },
        }).unwrap();
      } else {
        await createDistrict({
          name: form.name,
          code: form.code.toUpperCase(),
          province_id: provinceId,
        }).unwrap();
      }
      setOpen(false);
    } catch {
      setBlockedMessage('Failed to save district. Please try again.');
    }
  };

  const requestDelete = (district: District) => {
    const townsInDistrict = towns.filter((t) => t.district_id === district.id);
    if (townsInDistrict.length > 0) {
      setBlockedMessage(
        `Cannot delete ${district.name} — still referenced by ${townsInDistrict.length} town(s). Reassign or remove those towns first.`
      );
      return;
    }
    setBlockedMessage(null);
    setDistrictToDelete(district);
  };

  const confirmDelete = async () => {
    if (districtToDelete) {
      try {
        await deleteDistrict(districtToDelete.id).unwrap();
      } catch {
        setBlockedMessage('Failed to delete district. Please try again.');
      }
    }
    setDistrictToDelete(null);
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/admin/provinces')}
        sx={{ mb: 2 }}
      >
        Back to Provinces
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Districts
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add District
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click a district to manage its towns.
      </Typography>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      {districtsInProvince.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No districts added yet for {province.name}.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60}>S.No</TableCell>
                <TableCell>District name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Towns</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {districtsInProvince.map((district, index) => {
                const townCount = towns.filter((t) => t.district_id === district.id).length;
                return (
                  <TableRow key={district.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link
                        component="button"
                        onClick={() => router.push(`/admin/districts/${district.id}`)}
                        sx={{ fontWeight: 600, textAlign: 'left' }}
                      >
                        {district.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip label={district.code} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {townCount} town{townCount === 1 ? '' : 's'}
                    </TableCell>
                    <TableCell align="right">
                      <RowActionsMenu
                        actions={[
                          {
                            key: 'view',
                            label: 'View towns',
                            icon: <VisibilityIcon fontSize="small" />,
                            onClick: () => router.push(`/admin/districts/${district.id}`),
                          },
                          {
                            key: 'edit',
                            label: 'Edit',
                            icon: <EditIcon fontSize="small" />,
                            onClick: () => openEdit(district),
                          },
                          {
                            key: 'delete',
                            label: 'Delete',
                            icon: <DeleteIcon fontSize="small" />,
                            destructive: true,
                            dividerBefore: true,
                            onClick: () => requestDelete(district),
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
        <DialogTitle>{editingId ? 'Edit District' : 'Add District'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="District Name"
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
            {editingId ? 'Save Changes' : 'Add District'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!districtToDelete}
        onClose={() => setDistrictToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete District</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete <strong>{districtToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setDistrictToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
