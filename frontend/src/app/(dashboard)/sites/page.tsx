'use client';

import { usePermission } from '@/hooks/usePermission';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { isWithinScope } from '@/utils/scopeFilter';
import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import SiteForm from '@/features/sites/SiteForm';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import type { Site, SiteStatus, CreateSiteDto } from '@/types/site';
import {
  useCreateSiteMutation,
  useDeleteSiteMutation,
  useGetSitesQuery,
  useUpdateSiteMutation,
} from '@/store/api/siteApi';
import {
  useGetDistrictsQuery,
  useGetProvincesQuery,
  useGetTownsQuery,
} from '@/store/api/provinceApi';

const SITE_STATUS_OPTIONS: SiteStatus[] = [
  'PLANNED',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CLOSED',
];

type SortColumn = 'name' | 'district' | 'town' | 'status';
type SortDirection = 'asc' | 'desc';

export default function SitesPage() {
  const router = useRouter();
  const { provinceIds, siteIds } = usePermission();
  const { canCreate, canUpdate, canDelete } = useCrudPermission('/sites');

  const { data: sitesData, isLoading } = useGetSitesQuery({ page_size: 200 });
  const { data: provincesData } = useGetProvincesQuery({ page_size: 100 });
  const { data: districtsData } = useGetDistrictsQuery({ page_size: 500 });
  const { data: townsData } = useGetTownsQuery({ page_size: 500 });

  const [createSite] = useCreateSiteMutation();
  const [updateSite] = useUpdateSiteMutation();
  const [deleteSite] = useDeleteSiteMutation();

  const provinces = provincesData?.data ?? [];
  const districts = districtsData?.data ?? [];
  const towns = townsData?.data ?? [];
  const sites = sitesData?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);

  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    document.title = 'Sites | SC-GIMS';
  }, []);

  const siteProvinceId = (site: Site) =>
    site.province_id ?? towns.find((t) => t.id === site.town_id)?.province_id;

  const siteDistrictId = (site: Site) =>
    site.district_id ?? towns.find((t) => t.id === site.town_id)?.district_id;

  const districtName = (site: Site) =>
    site.district_name ?? districts.find((d) => d.id === siteDistrictId(site))?.name ?? '—';

  const townName = (site: Site) =>
    site.town_name ?? towns.find((t) => t.id === site.town_id)?.name ?? '—';

  const visibleSites = sites.filter((site) =>
    isWithinScope({ provinceIds, siteIds }, siteProvinceId(site), site.id)
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortValue = (site: Site, column: SortColumn): string => {
    switch (column) {
      case 'name':
        return site.name || '';
      case 'district':
        return districtName(site);
      case 'town':
        return townName(site);
      case 'status':
        return site.status || '';
    }
  };

  const sortSites = (list: Site[]): Site[] => {
    const sorted = [...list].sort((a, b) => {
      const aVal = sortValue(a, sortColumn).toLowerCase();
      const bVal = sortValue(b, sortColumn).toLowerCase();
      return aVal.localeCompare(bVal);
    });
    return sortDirection === 'asc' ? sorted : sorted.reverse();
  };

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
        await createSite(data).unwrap();
      }
      setOpen(false);
    } catch {
      setBlockedMessage('Failed to save site. Please try again.');
    }
  };

  const handleDelete = (site: Site) => {
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

  const handleStatusChange = async (site: Site, status: SiteStatus) => {
    try {
      await updateSite({ id: site.id, data: { status } }).unwrap();
    } catch {
      setBlockedMessage('Failed to update site status. Please try again.');
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Sites
        </Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Site
          </Button>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Expand a province to see its sites.
      </Typography>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      {provinces.map((province) => {
        const sitesInProvince = sortSites(
          visibleSites.filter((s) => siteProvinceId(s) === province.id)
        );

        if (sitesInProvince.length === 0) return null;

        return (
          <Accordion key={province.id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{province.name}</Typography>
                <Chip label={sitesInProvince.length} size="small" />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sortDirection={sortColumn === 'name' ? sortDirection : false}>
                        <TableSortLabel
                          active={sortColumn === 'name'}
                          direction={sortColumn === 'name' ? sortDirection : 'asc'}
                          onClick={() => handleSort('name')}
                        >
                          Site
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={sortColumn === 'district' ? sortDirection : false}>
                        <TableSortLabel
                          active={sortColumn === 'district'}
                          direction={sortColumn === 'district' ? sortDirection : 'asc'}
                          onClick={() => handleSort('district')}
                        >
                          District
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={sortColumn === 'town' ? sortDirection : false}>
                        <TableSortLabel
                          active={sortColumn === 'town'}
                          direction={sortColumn === 'town' ? sortDirection : 'asc'}
                          onClick={() => handleSort('town')}
                        >
                          Town
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={sortColumn === 'status' ? sortDirection : false}>
                        <TableSortLabel
                          active={sortColumn === 'status'}
                          direction={sortColumn === 'status' ? sortDirection : 'asc'}
                          onClick={() => handleSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sitesInProvince.map((site) => (
                      <TableRow key={site.id} hover>
                        <TableCell>
                          <Link
                            href={`/sites/${site.id}`}
                            style={{ fontWeight: 600, color: 'inherit', textDecoration: 'underline' }}
                          >
                            {site.name}
                          </Link>
                        </TableCell>
                        <TableCell>{districtName(site)}</TableCell>
                        <TableCell>{townName(site)}</TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={site.status}
                            onChange={(e) =>
                              handleStatusChange(site, e.target.value as SiteStatus)
                            }
                            disabled={!canUpdate}
                            sx={{ minWidth: 140 }}
                          >
                            {SITE_STATUS_OPTIONS.map((s) => (
                              <MenuItem key={s} value={s}>
                                {s}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell align="right">
                          <RowActionsMenu
                            actions={[
                              {
                                key: 'view',
                                label: 'View',
                                icon: <VisibilityIcon fontSize="small" />,
                                onClick: () => router.push(`/sites/${site.id}`),
                              },
                              ...(canUpdate
                                ? [
                                    {
                                      key: 'edit',
                                      label: 'Edit',
                                      icon: <EditIcon fontSize="small" />,
                                      onClick: () => openEdit(site),
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
                                      onClick: () => handleDelete(site),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSite ? 'Edit Site' : 'Create Site'}</DialogTitle>
        <DialogContent>
          <SiteForm
            defaultValues={
              editingSite
                ? {
                    project_id: editingSite.project_id,
                    district_id: siteDistrictId(editingSite) ?? '',
                    town_id: editingSite.town_id,
                    name: editingSite.name,
                    location: editingSite.location,
                    latitude: editingSite.latitude,
                    longitude: editingSite.longitude,
                    geofence_radius_m: editingSite.geofence_radius_m,
                  }
                : {
                    project_id: '',
                    district_id: '',
                    town_id: '',
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