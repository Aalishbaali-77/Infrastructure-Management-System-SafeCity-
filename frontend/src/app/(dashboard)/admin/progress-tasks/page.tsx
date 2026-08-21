'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DataTable from '@/components/organisms/DataTable';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import Toast from '@/components/atoms/Toast';
import KpiSchemaEditor from '@/components/molecules/KpiSchemaEditor';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { useGetProvincesQuery } from '@/store/api/provinceApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetBoqItemsQuery, useGetBoqsQuery } from '@/store/api/boqApi';
import {
  useCreateProgressTaskTemplateMutation,
  useCreateSiteProgressTaskMutation,
  useDeleteProgressTaskTemplateMutation,
  useDeleteSiteProgressTaskMutation,
  useGetProgressTaskTemplatesQuery,
  useGetSiteProgressTasksQuery,
  useUpdateProgressTaskTemplateMutation,
  useUpdateSiteProgressTaskMutation,
} from '@/store/api/progressApi';
import type { ProgressKpiField, ProgressTaskTemplate, SiteProgressTask } from '@/types/dailyProgress';
import { slugify } from '@/utils/slugify';

export default function ProgressTasksAdminPage() {
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = useCrudPermission('/daily-progress');
  const [tab, setTab] = useState(0);
  const [provinceFilter, setProvinceFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [siteId, setSiteId] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: provincesData } = useGetProvincesQuery({ page_size: 100 });
  const provinces = provincesData?.data ?? [];

  const { data: allProjectsData } = useGetProjectsQuery({ page_size: 200 });
  const allProjects = allProjectsData?.data ?? [];

  // Projects narrow to the selected province; if no province chosen,
  // show every project.
  const projects = useMemo(() => {
    if (!provinceFilter) return allProjects;
    return allProjects.filter((p) => p.province_id === provinceFilter);
  }, [allProjects, provinceFilter]);

  const { data: sitesData, isLoading: loadingSites } = useGetSitesQuery({ page_size: 200 });
  const allSites = useMemo(() => sitesData?.data ?? [], [sitesData]);

  // Sites narrow to the selected project (which itself may already be
  // narrowed by province); if no project chosen, fall back to province-only
  // filtering by cross-referencing each site's project; if neither is
  // chosen, show every site.
  const sites = useMemo(() => {
    if (projectFilter) return allSites.filter((s) => s.project_id === projectFilter);
    if (provinceFilter) {
      const projectIdsInProvince = new Set(projects.map((p) => p.id));
      return allSites.filter((s) => projectIdsInProvince.has(s.project_id));
    }
    return allSites;
  }, [allSites, projectFilter, provinceFilter, projects]);

  const { data: templatesData, isLoading: loadingTemplates } = useGetProgressTaskTemplatesQuery({
    page_size: 100,
  });
  const { data: siteTasksData, isLoading: loadingSiteTasks } = useGetSiteProgressTasksQuery(
    { site_id: siteId, page_size: 100 },
    { skip: !siteId }
  );

  const selectedSite = sites.find((s) => s.id === siteId);

  const { data: boqsData } = useGetBoqsQuery(
    { project_id: selectedSite?.project_id, page_size: 50 },
    { skip: !selectedSite }
  );

  const [createTemplate] = useCreateProgressTaskTemplateMutation();
  const [updateTemplate] = useUpdateProgressTaskTemplateMutation();
  const [deleteTemplate] = useDeleteProgressTaskTemplateMutation();
  const [createSiteTask] = useCreateSiteProgressTaskMutation();
  const [updateSiteTask] = useUpdateSiteProgressTaskMutation();
  const [deleteSiteTask] = useDeleteSiteProgressTaskMutation();

  const templates = useMemo(() => templatesData?.data ?? [], [templatesData]);
  const siteTasks = siteTasksData?.data ?? [];
  const boqs = boqsData?.data ?? [];

  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProgressTaskTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    key: '',
    name: '',
    category: '',
    unit: 'm',
    description: '',
  });
  const [templateKpiSchema, setTemplateKpiSchema] = useState<ProgressKpiField[]>([]);

  const [siteTaskOpen, setSiteTaskOpen] = useState(false);
  const [editingSiteTask, setEditingSiteTask] = useState<SiteProgressTask | null>(null);
  const [siteTaskForm, setSiteTaskForm] = useState({
    template_id: '',
    boq_id: '',
    boq_item_id: '',
    key: '',
    name: '',
    category: '',
    unit: 'm',
    planned_quantity: '',
    sort_order: '0',
  });
  const [siteTaskKpiSchema, setSiteTaskKpiSchema] = useState<ProgressKpiField[]>([]);

  const { data: boqItemsData } = useGetBoqItemsQuery(siteTaskForm.boq_id, {
    skip: !siteTaskForm.boq_id,
  });
  const boqItems = boqItemsData?.data ?? [];

  useEffect(() => {
    document.title = 'Progress Tasks | SC-GIMS';
  }, []);

  // Reset the site selection whenever the province/project filters change,
  // since the previously-selected site may no longer be in the filtered list.
  const [prevFilterKey, setPrevFilterKey] = useState(`${provinceFilter}|${projectFilter}`);
  const filterKey = `${provinceFilter}|${projectFilter}`;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setSiteId('');
  }

  const [prevSites, setPrevSites] = useState(sites);
  if (sites !== prevSites) {
    setPrevSites(sites);
    if (!siteId && sites.length) setSiteId(sites[0].id);
  }

  const categories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category).filter(Boolean))),
    [templates]
  );

  const validateKpiSchema = (schema: ProgressKpiField[]): string | null => {
    const keys = schema.map((f) => f.key);
    if (keys.some((k) => !k)) {
      return 'Every subtask name must produce a valid key (use letters or numbers).';
    }
    if (new Set(keys).size !== keys.length) {
      return 'Subtask names must be unique.';
    }
    return null;
  };

  if (loadingSites || loadingTemplates) return <PageSkeleton />;

  if (!canCreate && !canUpdate) {
    return (
      <Alert severity="warning">
        You do not have permission to manage progress tasks. Ask an admin or HOD.
      </Alert>
    );
  }

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ key: '', name: '', category: '', unit: 'm', description: '' });
    setTemplateKpiSchema([]);
    setTemplateOpen(true);
  };

  const openEditTemplate = (row: ProgressTaskTemplate) => {
    setEditingTemplate(row);
    setTemplateForm({
      key: row.key,
      name: row.name,
      category: row.category,
      unit: row.unit,
      description: row.description,
    });
    setTemplateKpiSchema(row.kpi_schema ?? []);
    setTemplateOpen(true);
  };

  const saveTemplate = async () => {
    const filteredTemplateKpiSchema = templateKpiSchema.filter((f) => f.label.trim());
    const kpiError = validateKpiSchema(filteredTemplateKpiSchema);
    if (kpiError) {
      setToast({ open: true, message: kpiError, severity: 'error' });
      return;
    }
    try {
      const key = templateForm.key || slugify(templateForm.name);
      const payload = {
        key,
        name: templateForm.name,
        category: templateForm.category,
        unit: templateForm.unit,
        description: templateForm.description,
        kpi_schema: filteredTemplateKpiSchema,
        is_active: true,
      };
      if (editingTemplate) {
        await updateTemplate({ id: editingTemplate.id, data: payload }).unwrap();
      } else {
        await createTemplate(payload).unwrap();
      }
      setTemplateOpen(false);
      setToast({ open: true, message: 'Template saved', severity: 'success' });
    } catch (e) {
      setToast({
        open: true,
        message: (e as { data?: { detail?: string } })?.data?.detail || 'Save failed',
        severity: 'error',
      });
    }
  };

  const openCreateSiteTask = () => {
    setEditingSiteTask(null);
    setSiteTaskForm({
      template_id: '',
      boq_id: boqs[0]?.id ?? '',
      boq_item_id: '',
      key: '',
      name: '',
      category: '',
      unit: 'm',
      planned_quantity: '',
      sort_order: String(siteTasks.length),
    });
    setSiteTaskKpiSchema([]);
    setSiteTaskOpen(true);
  };

  const openEditSiteTask = (row: SiteProgressTask) => {
    setEditingSiteTask(row);
    setSiteTaskForm({
      template_id: row.template_id ?? '',
      boq_id: row.boq_id ?? '',
      boq_item_id: row.boq_item_id ?? '',
      key: row.key,
      name: row.name,
      category: row.category,
      unit: row.unit,
      planned_quantity: String(row.planned_quantity ?? ''),
      sort_order: String(row.sort_order ?? 0),
    });
    setSiteTaskKpiSchema(row.kpi_schema ?? []);
    setSiteTaskOpen(true);
  };

  const onTemplatePick = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    setSiteTaskForm((f) => ({
      ...f,
      template_id: templateId,
      key: t?.key ?? f.key,
      name: t?.name ?? f.name,
      category: t?.category ?? f.category,
      unit: t?.unit ?? f.unit,
    }));
    if (t) setSiteTaskKpiSchema(t.kpi_schema);
  };

  const onBoqItemPick = (itemId: string) => {
    const item = boqItems.find((i) => i.id === itemId);
    setSiteTaskForm((f) => ({
      ...f,
      boq_item_id: itemId,
      planned_quantity: item ? String(item.qty) : f.planned_quantity,
      unit: item?.unit || f.unit,
      category: item?.item_type || f.category,
    }));
  };

  const saveSiteTask = async () => {
    if (!siteId) return;
    const filteredSiteTaskKpiSchema = siteTaskKpiSchema.filter((f) => f.label.trim());
    const kpiError = validateKpiSchema(filteredSiteTaskKpiSchema);
    if (kpiError) {
      setToast({ open: true, message: kpiError, severity: 'error' });
      return;
    }
    try {
      const payload = {
        site_id: siteId,
        template_id: siteTaskForm.template_id || null,
        boq_id: siteTaskForm.boq_id || null,
        boq_item_id: siteTaskForm.boq_item_id || null,
        key: siteTaskForm.key || slugify(siteTaskForm.name),
        name: siteTaskForm.name,
        category: siteTaskForm.category,
        unit: siteTaskForm.unit,
        planned_quantity: Number(siteTaskForm.planned_quantity) || 0,
        sort_order: Number(siteTaskForm.sort_order) || 0,
        is_active: true,
        kpi_schema: filteredSiteTaskKpiSchema,
        attributes: editingSiteTask?.attributes ?? {},
      };
      if (editingSiteTask) {
        await updateSiteTask({ id: editingSiteTask.id, data: payload }).unwrap();
      } else {
        await createSiteTask(payload).unwrap();
      }
      setSiteTaskOpen(false);
      setToast({ open: true, message: 'Site task saved', severity: 'success' });
    } catch (e) {
      setToast({
        open: true,
        message: (e as { data?: { detail?: string } })?.data?.detail || 'Save failed',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <IconButton
          onClick={() => router.push('/System_admin')}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="h5">Progress Tasks & KPIs</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Global catalog" />
        <Tab label="Assign to site" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Reusable templates</Typography>
            {canCreate && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateTemplate}>
                Add template
              </Button>
            )}
          </Stack>
          <DataTable
            rows={templates}
            columns={[
              { field: 'key', headerName: 'Key', flex: 1 },
              { field: 'name', headerName: 'Name', flex: 1.4 },
              { field: 'category', headerName: 'Category', flex: 0.8 },
              { field: 'unit', headerName: 'Unit', flex: 0.5 },
              {
                field: 'kpi_schema',
                headerName: 'KPI fields',
                flex: 0.6,
                renderCell: ({ row }: { row: ProgressTaskTemplate }) =>
                  row.kpi_schema?.length ?? 0,
              },
              {
                field: 'is_active',
                headerName: 'Active',
                flex: 0.5,
                renderCell: ({ row }: { row: ProgressTaskTemplate }) => (
                  <Chip
                    size="small"
                    label={row.is_active ? 'Yes' : 'No'}
                    color={row.is_active ? 'success' : 'default'}
                  />
                ),
              },
              {
                field: 'actions',
                headerName: '',
                width: 72,
                sortable: false,
                renderCell: ({ row }: { row: ProgressTaskTemplate }) => (
                  <RowActionsMenu
                    actions={[
                      ...(canUpdate
                        ? [
                            {
                              key: 'edit',
                              label: 'Edit',
                              icon: <EditIcon fontSize="small" />,
                              onClick: () => openEditTemplate(row),
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
                              onClick: async () => {
                                try {
                                  await deleteTemplate(row.id).unwrap();
                                  setToast({
                                    open: true,
                                    message: 'Template deleted',
                                    severity: 'success',
                                  });
                                } catch {
                                  setToast({
                                    open: true,
                                    message: 'Delete failed (in use?)',
                                    severity: 'error',
                                  });
                                }
                              },
                            },
                          ]
                        : []),
                    ]}
                  />
                ),
              },
            ]}
            rowCount={templates.length}
            paginationModel={{ page: 0, pageSize: 25 }}
            onPaginationModelChange={() => {}}
          />
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 2, justifyContent: 'space-between', alignItems: { sm: 'center' }, flexWrap: 'wrap' }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Province"
                size="small"
                value={provinceFilter}
                onChange={(e) => {
                  setProvinceFilter(e.target.value);
                  setProjectFilter('');
                }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All provinces</MenuItem>
                {provinces.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
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
                label="Site"
                size="small"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                sx={{ minWidth: 220 }}
                disabled={sites.length === 0}
              >
                {sites.length === 0 && <MenuItem value="">No sites match this filter</MenuItem>}
                {sites.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!siteId}
                onClick={openCreateSiteTask}
              >
                Add site task
              </Button>
            )}
          </Stack>

          {!siteId ? (
            <Alert severity="info">Select a site to manage its progress tasks.</Alert>
          ) : loadingSiteTasks ? (
            <PageSkeleton />
          ) : (
            <DataTable
              rows={siteTasks}
              columns={[
                { field: 'key', headerName: 'Key', flex: 0.9 },
                { field: 'name', headerName: 'Task / KPI', flex: 1.2 },
                { field: 'category', headerName: 'Category', flex: 0.7 },
                {
                  field: 'boq_item_code',
                  headerName: 'BOQ Item',
                  flex: 1,
                  renderCell: ({ row }: { row: SiteProgressTask }) =>
                    row.boq_item_code || '—',
                },
                { field: 'unit', headerName: 'Unit', flex: 0.4 },
                {
                  field: 'planned_quantity',
                  headerName: 'Planned',
                  flex: 0.6,
                  renderCell: ({ row }: { row: SiteProgressTask }) =>
                    Number(row.planned_quantity).toLocaleString(),
                },
                {
                  field: 'cumulative_quantity',
                  headerName: 'Done',
                  flex: 0.6,
                  renderCell: ({ row }: { row: SiteProgressTask }) =>
                    Number(row.cumulative_quantity).toLocaleString(),
                },
                {
                  field: 'is_active',
                  headerName: 'Active',
                  flex: 0.5,
                  renderCell: ({ row }: { row: SiteProgressTask }) => (
                    <Chip
                      size="small"
                      label={row.is_active ? 'Yes' : 'No'}
                      color={row.is_active ? 'success' : 'default'}
                    />
                  ),
                },
                {
                  field: 'actions',
                  headerName: '',
                  width: 72,
                  sortable: false,
                  renderCell: ({ row }: { row: SiteProgressTask }) => (
                    <RowActionsMenu
                      actions={[
                        ...(canUpdate
                          ? [
                              {
                                key: 'edit',
                                label: 'Edit',
                                icon: <EditIcon fontSize="small" />,
                                onClick: () => openEditSiteTask(row),
                              },
                            ]
                          : []),
                        ...(canDelete
                          ? [
                              {
                                key: 'delete',
                                label: 'Remove',
                                icon: <DeleteIcon fontSize="small" />,
                                destructive: true,
                                onClick: async () => {
                                  try {
                                    await deleteSiteTask(row.id).unwrap();
                                    setToast({
                                      open: true,
                                      message: 'Site task removed',
                                      severity: 'success',
                                    });
                                  } catch {
                                    setToast({
                                      open: true,
                                      message: 'Remove failed (has entries?)',
                                      severity: 'error',
                                    });
                                  }
                                },
                              },
                            ]
                          : []),
                      ]}
                    />
                  ),
                },
              ]}
              rowCount={siteTasks.length}
              paginationModel={{ page: 0, pageSize: 25 }}
              onPaginationModelChange={() => {}}
            />
          )}
        </Paper>
      )}

      <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTemplate ? 'Edit template' : 'New template'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={templateForm.name}
              onChange={(e) =>
                setTemplateForm((f) => ({
                  ...f,
                  name: e.target.value,
                  key: editingTemplate ? f.key : slugify(e.target.value),
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Key"
              value={templateForm.key}
              onChange={(e) => setTemplateForm((f) => ({ ...f, key: slugify(e.target.value) }))}
              fullWidth
              required
              helperText="Stable identifier used in daily progress (e.g. fiber_digging)"
            />
            <TextField
              label="Category"
              value={templateForm.category}
              onChange={(e) => setTemplateForm((f) => ({ ...f, category: e.target.value }))}
              fullWidth
              placeholder="FIBER / CIVIL / CONDUIT"
              select={categories.length > 0}
            >
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            {!categories.length || !categories.includes(templateForm.category) ? (
              <TextField
                label="Or type category"
                value={templateForm.category}
                onChange={(e) => setTemplateForm((f) => ({ ...f, category: e.target.value }))}
                fullWidth
              />
            ) : null}
            <TextField
              label="Unit"
              value={templateForm.unit}
              onChange={(e) => setTemplateForm((f) => ({ ...f, unit: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Description"
              value={templateForm.description}
              onChange={(e) => setTemplateForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <KpiSchemaEditor value={templateKpiSchema} onChange={setTemplateKpiSchema} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!templateForm.name || !templateForm.key}
            onClick={saveTemplate}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={siteTaskOpen} onClose={() => setSiteTaskOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingSiteTask ? 'Edit site task' : 'Add task to site'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="From catalog (optional)"
              value={siteTaskForm.template_id}
              onChange={(e) => onTemplatePick(e.target.value)}
              fullWidth
            >
              <MenuItem value="">Custom / blank</MenuItem>
              {templates
                .filter((t) => t.is_active)
                .map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} ({t.key})
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="BOQ"
              value={siteTaskForm.boq_id}
              onChange={(e) =>
                setSiteTaskForm((f) => ({ ...f, boq_id: e.target.value, boq_item_id: '' }))
              }
              fullWidth
              helperText={boqs.length ? undefined : 'No BOQ on this project yet'}
            >
              <MenuItem value="">None</MenuItem>
              {boqs.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.template || 'BOQ'} v{b.version} ({b.status})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="BOQ line item"
              value={siteTaskForm.boq_item_id}
              onChange={(e) => onBoqItemPick(e.target.value)}
              fullWidth
              disabled={!siteTaskForm.boq_id}
            >
              <MenuItem value="">None</MenuItem>
              {boqItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.item} — {item.item_description.slice(0, 40)} (qty {Number(item.qty)})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Name"
              value={siteTaskForm.name}
              onChange={(e) =>
                setSiteTaskForm((f) => ({
                  ...f,
                  name: e.target.value,
                  key: editingSiteTask ? f.key : slugify(e.target.value),
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Key"
              value={siteTaskForm.key}
              onChange={(e) => setSiteTaskForm((f) => ({ ...f, key: slugify(e.target.value) }))}
              fullWidth
              required
            />
            <TextField
              label="Category"
              value={siteTaskForm.category}
              onChange={(e) => setSiteTaskForm((f) => ({ ...f, category: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Unit"
              value={siteTaskForm.unit}
              onChange={(e) => setSiteTaskForm((f) => ({ ...f, unit: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Planned quantity"
              type="number"
              value={siteTaskForm.planned_quantity}
              onChange={(e) => setSiteTaskForm((f) => ({ ...f, planned_quantity: e.target.value }))}
              fullWidth
              helperText="Defaults from BOQ qty when a line item is selected"
            />
            <TextField
              label="Sort order"
              type="number"
              value={siteTaskForm.sort_order}
              onChange={(e) => setSiteTaskForm((f) => ({ ...f, sort_order: e.target.value }))}
              fullWidth
            />
            <KpiSchemaEditor value={siteTaskKpiSchema} onChange={setSiteTaskKpiSchema} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSiteTaskOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!siteTaskForm.name || !siteTaskForm.key}
            onClick={saveSiteTask}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Box>
  );
}