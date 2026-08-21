'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StatusChip from '@/components/molecules/StatusChip';
import { useBreadcrumbLabel } from '@/contexts/BreadcrumbContext';
import SiteForm from '@/features/sites/SiteForm';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import type { Site, CreateSiteDto } from '@/types/site';
import {
  useCreateSiteMutation,
  useDeleteSiteMutation,
  useGetSitesQuery,
  useUpdateSiteMutation,
} from '@/store/api/siteApi';
import { useGetTownQuery } from '@/store/api/provinceApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';

export default function TownDetailPage() {
  const params = useParams();
  const router = useRouter();
  const townId = params.id as string;

  const { data: town, isError: townError } = useGetTownQuery(townId);
  useBreadcrumbLabel(`/admin/towns/${townId}`, town?.name);
  const { data: sitesData } = useGetSitesQuery({ town_id: townId, page_size: 200 });
  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });

  const [createSite] = useCreateSiteMutation();
  const [updateSite] = useUpdateSiteMutation();
  const [deleteSite] = useDeleteSiteMutation();

  const sitesInTown = sitesData?.data ?? [];
  const projects = projectsData?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = town ? `${town.name} | SC-GIMS` : 'Town Not Found | SC-GIMS';
  }, [town]);

  if (townError || !town) {
    return (
      <Box>
        <Typography variant="h5">Town not found</Typography>
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

  const projectIds = new Set(sitesInTown.map((s) => s.project_id));
  const projectsInTown = projects.filter((p) => projectIds.has(p.id));

  const activeSites = sitesInTown.filter((s) => s.status === 'ACTIVE').length;
  const plannedSites = sitesInTown.filter((s) => s.status === 'PLANNED').length;
  const onHoldSites = sitesInTown.filter((s) => s.status === 'ON_HOLD').length;

  const openCreate = () => {
    setEditingSite(null);
    setOpen(true);
  };

  const openEdit = (site: Site) => {
    setEditingSite(site);
    setOpen(true);
  };

  const handleFormSubmit = async (data: CreateSiteDto) => {
    try {
      if (editingSite) {
        await updateSite({ id: editingSite.id, data }).unwrap();
      } else {
        await createSite({ ...data, town_id: townId }).unwrap();
      }
      setOpen(false);
    } catch {
      setBlockedMessage('Failed to save site. Please try again.');
    }
  };

  const requestDelete = (site: Site) => {
    setBlockedMessage(null);
    setSiteToDelete(site);
  };

  const confirmDelete = async () => {
    if (siteToDelete) {
      try {
        await deleteSite(siteToDelete.id).unwrap();
      } catch {
        setBlockedMessage('Failed to delete site. Please try again.');
      }
    }
    setSiteToDelete(null);
  };

  const locationLabel = [town.district_name, town.province_name].filter(Boolean).join(' · ');

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/admin/districts/${town.district_id}`)}
        sx={{ mb: 2 }}
      >
        Back to {town.district_name ?? 'District'} Towns
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1">
          {town.name}
        </Typography>
        <Chip label={town.code} size="small" variant="outlined" />
        {locationLabel && (
          <Typography variant="body2" color="text.secondary">
          </Typography>
        )}
      </Box>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total Sites
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {sitesInTown.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="success.main">
              Active
            </Typography>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
              {activeSites}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Planned
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {plannedSites}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="error.main">
              On Hold
            </Typography>
            <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
              {onHoldSites}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Sites in {town.name}</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
            Add Site
          </Button>
        </Box>
        {sitesInTown.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No sites in this town yet.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sitesInTown.map((site) => (
              <Box
                key={site.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                  onClick={() => router.push(`/sites/${site.id}`)}
                >
                  <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {site.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {site.location}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatusChip status={site.status} />
                  <RowActionsMenu
                    actions={[
                      {
                        key: 'view',
                        label: 'View',
                        icon: <VisibilityIcon fontSize="small" />,
                        onClick: () => router.push(`/sites/${site.id}`),
                      },
                      {
                        key: 'edit',
                        label: 'Edit',
                        icon: <EditIcon fontSize="small" />,
                        onClick: () => openEdit(site),
                      },
                      {
                        key: 'delete',
                        label: 'Delete',
                        icon: <DeleteIcon fontSize="small" />,
                        destructive: true,
                        dividerBefore: true,
                        onClick: () => requestDelete(site),
                      },
                    ]}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Projects Touching {town.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Projects are linked at the province level; these are the projects whose sites fall within
          this town.
        </Typography>
        {projectsInTown.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No projects touch this town yet.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {projectsInTown.map((project) => (
              <Box
                key={project.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{project.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {project.program_code}
                  </Typography>
                </Box>
                <StatusChip status={project.status} />
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSite ? 'Edit Site' : 'Create Site'}</DialogTitle>
        <DialogContent>
          <SiteForm
            defaultValues={
              editingSite
                ? {
                    project_id: editingSite.project_id,
                    district_id: editingSite.district_id ?? town.district_id,
                    town_id: editingSite.town_id,
                    name: editingSite.name,
                    location: editingSite.location,
                    latitude: editingSite.latitude,
                    longitude: editingSite.longitude,
                    geofence_radius_m: editingSite.geofence_radius_m,
                  }
                : {
                    project_id: '',
                    district_id: town.district_id,
                    town_id: townId,
                    name: '',
                    location: '',
                    geofence_radius_m: 500,
                  }
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!siteToDelete} onClose={() => setSiteToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Site</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete <strong>{siteToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setSiteToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
