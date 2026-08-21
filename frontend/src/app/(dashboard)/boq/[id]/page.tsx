'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useBreadcrumbLabel } from '@/contexts/BreadcrumbContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PublishIcon from '@mui/icons-material/Publish';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import PaidIcon from '@mui/icons-material/Paid';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import UpdateIcon from '@mui/icons-material/Update';
import StatusChip from '@/components/molecules/StatusChip';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import Toast from '@/components/atoms/Toast';
import BOQUploader from '@/components/molecules/BOQUploader';
import { usePermission } from '@/hooks/usePermission';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { BOQ_SPREADSHEET_COLUMNS } from '@/lib/boq/spreadsheet';
import {
  useBulkReplaceBoqItemsMutation,
  useCreateBoqItemMutation,
  useGetBoqItemsQuery,
  useGetBoqQuery,
  useMarkBoqReadyMutation,
  usePublishBoqMutation,
} from '@/store/api/boqApi';
import type { BOQItemWrite } from '@/types/boq';

const ADD_FIELDS: Array<[keyof BOQItemWrite, string, boolean?]> = [
  ['pc1', 'PC1'],
  ['no', 'NO.'],
  ['item_type', 'ITEM TYPE'],
  ['item', 'ITEM', true],
  ['item_description', 'Item Description', true],
  ['model_name', 'Model Name'],
  ['model', 'Model'],
  ['oem', 'OEM'],
  ['unit', 'UNIT', true],
  ['package_qty', 'Package Qty'],
  ['qty', 'QTY'],
  ['fob', 'FOB'],
  ['hs_code_description', 'HS Code Description'],
  ['hs_code', 'HS Code'],
  ['curr', 'CURR'],
  ['tax', 'TAX'],
  ['curr_rate', 'CURR Rate'],
  ['bank_charges_pct', 'Bank Charges %'],
  ['freight_pct', 'Freight %'],
  ['landing_pct', 'Landing %'],
  ['insurance_pct', 'Insurance %'],
  ['cd_pct', 'CD%'],
  ['acd_pct', 'ACD%'],
  ['rd_pct', 'RD%'],
  ['st_pct', 'ST%'],
  ['ast_pct', 'AST%'],
  ['it_pct', 'IT%'],
  ['cess_pct', 'CESS%'],
  ['bank_charges', 'BankCharges'],
  ['freight_insurance', 'F/I'],
  ['price_with_fi', 'PriceWithF/I'],
  ['landing', 'Landing'],
  ['insurance', 'Insurance'],
  ['custom_duty', 'CustomDuty'],
  ['addl_custom_duty', 'AddlCustomDuty'],
  ['regulatory_duty', 'RegulatoryDuty'],
  ['sales_tax', 'SalesTax'],
  ['addl_sales_tax', 'AddlSalesTax'],
  ['income_tax', 'IncomeTax'],
  ['cess_tax', 'CessTax'],
  ['ddp_unit_usd', 'DDPUnit USD'],
  ['ddp_unit_pkr', 'DDPUnit PKR'],
];

const emptyItemForm = (): Record<string, string> =>
  Object.fromEntries(
    ADD_FIELDS.map(([key]) => [
      key,
      key === 'no'
        ? '1'
        : key === 'unit'
          ? 'NOS'
          : key === 'curr'
            ? 'USD'
            : key === 'curr_rate'
              ? '280'
              : '',
    ])
  );

const pillButtonSx = {
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 600,
  px: 2.25,
};

export default function BOQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boqId = String(params.id);
  const { hasAnyRole } = usePermission();
  const { canCreate, canUpdate } = useCrudPermission('/boq');
  const canPublish = hasAnyRole(['HOD', 'DIR', 'SYSTEM_ADMIN']);

  const { data: boq, isLoading, isError, error, refetch } = useGetBoqQuery(boqId);
  useBreadcrumbLabel(`/boq/${boqId}`, boq?.project_name ? `${boq.project_name} — BOQ` : undefined);
  const { data: itemsData, isLoading: loadingItems } = useGetBoqItemsQuery(boqId);
  const [publishBoq, { isLoading: publishing }] = usePublishBoqMutation();
  const [markReady, { isLoading: marking }] = useMarkBoqReadyMutation();
  const [createItem, { isLoading: creatingItem }] = useCreateBoqItemMutation();
  const [bulkReplace, { isLoading: importing }] = useBulkReplaceBoqItemsMutation();

  const [publishOpen, setPublishOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const itemColumns = useMemo<GridColDef[]>(
    () =>
      BOQ_SPREADSHEET_COLUMNS.map((col) =>
        col.field === 'item'
          ? {
              ...col,
              renderCell: (params: GridRenderCellParams) => (
                <Link
                  href={`/boq/${boqId}/items/${params.row.id}`}
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  {params.value as string}
                </Link>
              ),
            }
          : col
      ),
    [boqId]
  );

  useEffect(() => {
    document.title = boq ? `BOQ — ${boq.project_name} | SC-GIMS` : 'BOQ | SC-GIMS';
  }, [boq]);

  if (isLoading) return <PageSkeleton />;

  if (isError || !boq) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as { data?: { detail?: string } })?.data?.detail || 'BOQ not found.'}
        </Alert>
        <Button onClick={() => router.push('/boq')}>Back to BOQ</Button>
      </Box>
    );
  }

  const items = itemsData?.data ?? [];
  const editable = boq.status !== 'PUBLISHED';

  const handlePublish = async () => {
    try {
      await publishBoq(boqId).unwrap();
      setPublishOpen(false);
      setToast({ open: true, message: 'BOQ published successfully', severity: 'success' });
    } catch (e) {
      setToast({
        open: true,
        message: (e as { data?: { detail?: string } })?.data?.detail || 'Publish failed',
        severity: 'error',
      });
    }
  };

  const handleImport = async (parsed: BOQItemWrite[]) => {
    await bulkReplace({ boqId, items: parsed }).unwrap();
    setToast({
      open: true,
      message: `Imported ${parsed.length} spreadsheet rows`,
      severity: 'success',
    });
    refetch();
  };

  const handleAddItem = async () => {
    const num = (key: string) => Number(itemForm[key]) || 0;
    try {
      await createItem({
        boqId,
        data: {
          pc1: itemForm.pc1,
          no: Math.max(1, Math.floor(num('no') || 1)),
          item_type: itemForm.item_type,
          item: itemForm.item,
          item_description: itemForm.item_description,
          model_name: itemForm.model_name,
          model: itemForm.model,
          oem: itemForm.oem,
          unit: itemForm.unit || 'NOS',
          package_qty: num('package_qty'),
          qty: num('qty'),
          actual_quantity: 0,
          fob: num('fob'),
          hs_code_description: itemForm.hs_code_description,
          hs_code: itemForm.hs_code,
          curr: itemForm.curr || 'USD',
          tax: itemForm.tax,
          curr_rate: num('curr_rate'),
          bank_charges_pct: num('bank_charges_pct'),
          freight_pct: num('freight_pct'),
          landing_pct: num('landing_pct'),
          insurance_pct: num('insurance_pct'),
          cd_pct: num('cd_pct'),
          acd_pct: num('acd_pct'),
          rd_pct: num('rd_pct'),
          st_pct: num('st_pct'),
          ast_pct: num('ast_pct'),
          it_pct: num('it_pct'),
          cess_pct: num('cess_pct'),
          bank_charges: num('bank_charges'),
          freight_insurance: num('freight_insurance'),
          price_with_fi: num('price_with_fi') || num('fob'),
          landing: num('landing'),
          insurance: num('insurance'),
          custom_duty: num('custom_duty'),
          addl_custom_duty: num('addl_custom_duty'),
          regulatory_duty: num('regulatory_duty'),
          sales_tax: num('sales_tax'),
          addl_sales_tax: num('addl_sales_tax'),
          income_tax: num('income_tax'),
          cess_tax: num('cess_tax'),
          ddp_unit_usd: num('ddp_unit_usd'),
          ddp_unit_pkr: num('ddp_unit_pkr'),
          quantity_tolerance_pct: 5,
        },
      }).unwrap();
      setAddOpen(false);
      setItemForm(emptyItemForm());
      setToast({ open: true, message: 'Item added', severity: 'success' });
      refetch();
    } catch (e) {
      setToast({
        open: true,
        message: (e as { data?: { detail?: string } })?.data?.detail || 'Failed to add item',
        severity: 'error',
      });
    }
  };

  const statCards: { label: string; value: string; icon: React.ReactNode; color: 'primary' | 'info' | 'secondary' }[] = [
    {
      label: 'Total DDP (PKR)',
      value: `PKR ${Number(boq.total_amount).toLocaleString()}`,
      icon: <PaidIcon />,
      color: 'primary',
    },
    {
      label: 'Items',
      value: String(boq.items_count),
      icon: <Inventory2Icon />,
      color: 'info',
    },
    {
      label: 'Last Updated',
      value: new Date(boq.updated_at).toLocaleString(),
      icon: <UpdateIcon />,
      color: 'secondary',
    },
  ];

  return (
    <Box>
      {/* Header: icon-only back button + title on the left, action pills on the right */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'flex-start' },
        }}
      >
        <Box>
          <IconButton
            onClick={() => router.push('/boq')}
            sx={{
              mb: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            {boq.project_name} — BOQ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Template: {boq.template || '—'} · Version {boq.version}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <StatusChip status={boq.status} />
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={() => router.push(`/boq/${boq.id}/variance`)}
            sx={{
              ...pillButtonSx,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                borderColor: 'primary.main',
              },
            }}
          >
            Variance
          </Button>
          {editable && canUpdate && boq.status !== 'READY' && items.length > 0 && (
            <Button
              variant="outlined"
              disabled={marking}
              onClick={() => markReady(boqId)}
              sx={{ ...pillButtonSx, borderColor: 'divider', color: 'text.primary' }}
            >
              Mark Ready
            </Button>
          )}
          {editable && canCreate && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setItemForm(emptyItemForm());
                setAddOpen(true);
              }}
              sx={{ ...pillButtonSx, borderColor: 'divider', color: 'text.primary' }}
            >
              Add Item
            </Button>
          )}
          {boq.status === 'READY' && canPublish && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PublishIcon />}
              onClick={() => setPublishOpen(true)}
              sx={pillButtonSx}
            >
              Publish
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) => alpha(theme.palette[card.color].main, 0.12),
                      color: `${card.color}.main`,
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                      {card.value}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {editable && canCreate && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Import spreadsheet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload your BOQ Excel. Existing draft items are replaced with the sheet rows.
          </Typography>
          <BOQUploader disabled={importing} onParsed={handleImport} />
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Line items (PC1 → TotalDDP PKR)
        </Typography>
        {loadingItems ? (
          <PageSkeleton />
        ) : items.length === 0 ? (
          <Alert severity="info">No line items yet. Import the spreadsheet or use Add Item.</Alert>
        ) : (
          <DataGrid
            rows={items}
            columns={itemColumns}
            autoHeight
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            columnHeaderHeight={56}
            sx={{
              '& .MuiDataGrid-columnHeaderTitle': {
                whiteSpace: 'normal',
                lineHeight: 1.2,
                fontSize: 11,
              },
            }}
          />
        )}
      </Paper>

      <Dialog open={publishOpen} onClose={() => setPublishOpen(false)}>
        <DialogTitle>Publish BOQ</DialogTitle>
        <DialogContent>
          <Typography>
            Publishing locks this BOQ. Items can no longer be edited. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" disabled={publishing} onClick={handlePublish}>
            Confirm Publish
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Add BOQ Item</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              mt: 1,
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            {ADD_FIELDS.map(([key, label, required]) => (
              <TextField
                key={key}
                label={label}
                value={itemForm[key] ?? ''}
                onChange={(e) => setItemForm((f) => ({ ...f, [key]: e.target.value }))}
                fullWidth
                required={!!required}
                size="small"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={creatingItem || !itemForm.item || !itemForm.item_description}
            onClick={handleAddItem}
          >
            Save Item
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