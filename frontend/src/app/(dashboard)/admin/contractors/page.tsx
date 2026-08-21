'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import {
  useCreateUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
  type ApiUser,
} from '@/store/api/userApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { useGetDistrictsQuery, useGetProvincesQuery, useGetTownsQuery } from '@/store/api/provinceApi';

const emptyContractor = { name: '', email: '', phone: '' };

export default function ContractorAssignmentsPage() {
  const { data: usersData } = useGetUsersQuery({ role: 'CONTRACTOR', page_size: 200 });
  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });
  const { data: sitesData } = useGetSitesQuery({ page_size: 500 });
  const { data: provincesData } = useGetProvincesQuery({ page_size: 100 });
  const { data: districtsData } = useGetDistrictsQuery({ page_size: 500 });
  const { data: townsData } = useGetTownsQuery({ page_size: 500 });

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const contractors = usersData?.data ?? [];
  const projects = projectsData?.data ?? [];
  const sites = sitesData?.data ?? [];
  const provinces = provincesData?.data ?? [];
  const districts = districtsData?.data ?? [];
  const towns = townsData?.data ?? [];

  const [addOpen, setAddOpen] = useState(false);
  const [newContractor, setNewContractor] = useState(emptyContractor);
  const [editingContractor, setEditingContractor] = useState<ApiUser | null>(null);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'Contractor Assignments | SC-GIMS';
  }, []);

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id;
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  const handleAddContractor = async () => {
    try {
      await createUser({
        name: newContractor.name,
        email: newContractor.email,
        phone: newContractor.phone,
        role: 'CONTRACTOR',
        is_active: true,
      }).unwrap();
      setNewContractor(emptyContractor);
      setAddOpen(false);
    } catch {
      // keep dialog open on error
    }
  };

  const openAssign = (contractor: ApiUser) => {
    setEditingContractor(contractor);
    setSelectedSiteIds(contractor.site_ids);
    setSelectedProjectIds(contractor.project_ids);
  };

  const toggleSite = (siteId: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSaveAssignments = async () => {
    if (editingContractor) {
      try {
        await updateUser({
          id: editingContractor.id,
          data: { site_ids: selectedSiteIds, project_ids: selectedProjectIds },
        }).unwrap();
        setEditingContractor(null);
      } catch {
        // keep dialog open
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Contractor Assignments
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add Contractor
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add contractors and assign them to the projects and sites they are responsible for.
      </Typography>

      {contractors.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No contractors yet. Click Add Contractor to create one.
        </Typography>
      ) : (
        contractors.map((contractor) => (
          <Paper key={contractor.id} sx={{ mb: 2, p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1.5,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{contractor.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {contractor.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {contractor.phone || 'No phone'}
                </Typography>
              </Box>
              <RowActionsMenu
                actions={[
                  {
                    key: 'assign',
                    label: 'Manage assignments',
                    icon: <AssignmentIndIcon fontSize="small" />,
                    onClick: () => openAssign(contractor),
                  },
                ]}
              />
            </Box>

            <Typography variant="caption" color="text.secondary">
              Projects
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, mt: 0.5 }}>
              {contractor.project_ids.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None
                </Typography>
              ) : (
                contractor.project_ids.map((id) => (
                  <Chip key={id} label={projectName(id)} size="small" color="primary" />
                ))
              )}
            </Box>

            <Typography variant="caption" color="text.secondary">
              Sites
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {contractor.site_ids.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None
                </Typography>
              ) : (
                contractor.site_ids.map((id) => <Chip key={id} label={siteName(id)} size="small" />)
              )}
            </Box>
          </Paper>
        ))
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Contractor</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={newContractor.name}
              onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={newContractor.email}
              onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={newContractor.phone}
              onChange={(e) => setNewContractor({ ...newContractor, phone: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddContractor}
            disabled={!newContractor.name || !newContractor.email}
          >
            Create Contractor
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editingContractor}
        onClose={() => setEditingContractor(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign — {editingContractor?.name}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Projects
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
            {projects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No projects available.
              </Typography>
            ) : (
              projects.map((project) => (
                <FormControlLabel
                  key={project.id}
                  control={
                    <Checkbox
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      size="small"
                    />
                  }
                  label={project.name}
                />
              ))
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Sites
          </Typography>
          {provinces.map((province) => {
            const districtsInProvince = districts.filter((d) => d.province_id === province.id);
            const sitesInProvince = sites.filter(
              (s) =>
                s.province_id === province.id ||
                towns.some((t) => t.id === s.town_id && t.province_id === province.id)
            );
            if (sitesInProvince.length === 0) return null;

            return (
              <Box key={province.id} sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {province.name}
                </Typography>
                {districtsInProvince.map((district) => {
                  const townsInDistrict = towns.filter((t) => t.district_id === district.id);
                  const sitesInDistrict = sitesInProvince.filter(
                    (s) =>
                      s.district_id === district.id ||
                      townsInDistrict.some((t) => t.id === s.town_id)
                  );
                  if (sitesInDistrict.length === 0) return null;

                  return (
                    <Box key={district.id} sx={{ pl: 1, mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {district.name}
                      </Typography>
                      {townsInDistrict.map((town) => {
                        const sitesInTown = sitesInDistrict.filter((s) => s.town_id === town.id);
                        if (sitesInTown.length === 0) return null;

                        return (
                          <Box key={town.id} sx={{ pl: 2, mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {town.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', pl: 1 }}>
                              {sitesInTown.map((site) => (
                                <FormControlLabel
                                  key={site.id}
                                  control={
                                    <Checkbox
                                      checked={selectedSiteIds.includes(site.id)}
                                      onChange={() => toggleSite(site.id)}
                                      size="small"
                                    />
                                  }
                                  label={site.name}
                                />
                              ))}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingContractor(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAssignments}>
            Save Assignments
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
