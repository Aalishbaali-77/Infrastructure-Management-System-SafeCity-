'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import { useBreadcrumbLabel } from '@/contexts/BreadcrumbContext';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { useGetBoqItemsQuery } from '@/store/api/boqApi';
import { useGetSiteProgressTasksQuery } from '@/store/api/progressApi';
import { formatBoqNumber } from '@/lib/boq/spreadsheet';
import type { SiteProgressTask } from '@/types/dailyProgress';
import { useGetBoqQuery } from '@/store/api/boqApi';

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 6, sm: 3 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value ?? '—'}</Typography>
    </Grid>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ mb: 2, alignItems: 'center' }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6">{title}</Typography>
    </Stack>
  );
}

/**
 * The imported spreadsheet stores descriptions as a single string with
 * bullet points separated by "•". Split them into an actual list instead
 * of rendering as one dense paragraph.
 */
function parseBulletPoints(text: string): string[] {
  // Imported spreadsheet data has used different bullet characters
  // across sources (●, •, ▪, etc.) — split on any of them.
  return text
    .split(/[●•▪]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
export default function BoqItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boqId = String(params.id);
  const itemId = String(params.itemId);

  const { data: boq } = useGetBoqQuery(boqId);
  useBreadcrumbLabel(`/boq/${boqId}`, boq?.project_name ? `${boq.project_name} — BOQ` : undefined);

  const { data: itemsData, isLoading: loadingItems } = useGetBoqItemsQuery(boqId);
 
  
  const { data: tasksData, isLoading: loadingTasks } = useGetSiteProgressTasksQuery({
    boq_item_id: itemId,
  });

  const item = itemsData?.data.find((i) => i.id === itemId);

  useBreadcrumbLabel(`/boq/${boqId}/items/${itemId}`, item?.item);

  useEffect(() => {
    document.title = item ? `${item.item} — BOQ Item | SC-GIMS` : 'BOQ Item | SC-GIMS';
  }, [item]);

  if (loadingItems) return <PageSkeleton />;

  if (!item) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          BOQ item not found.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/boq/${boqId}`)}>
          Back to BOQ
        </Button>
      </Box>
    );
  }

  const tasks = tasksData?.data ?? [];
  const descriptionText = item.item_description || item.description || '';
  const bulletPoints = parseBulletPoints(descriptionText);

  return (
    <Box>
      <IconButton
        onClick={() => router.push(`/boq/${boqId}`)}
        sx={{
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ArrowBackIcon fontSize="small" />
      </IconButton>

      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        {item.item || item.item_code}
      </Typography>

      {bulletPoints.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <SectionHeader icon={<DescriptionOutlinedIcon fontSize="small" />} title="Description" />
          <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
            {bulletPoints.map((point, i) => (
              <Typography key={i} component="li" variant="body2" color="text.secondary">
                {point}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader icon={<InfoOutlinedIcon fontSize="small" />} title="Item details" />
        <Grid container spacing={3}>
          <DetailField label="Item Code" value={item.item_code} />
          <DetailField label="Item Type" value={item.item_type} />
          <DetailField label="Manufacturer (OEM)" value={item.oem} />
          <DetailField label="Model" value={item.model} />
          <DetailField label="Model Name" value={item.model_name} />
          <DetailField label="Unit" value={item.unit} />
          <DetailField label="Planned Qty" value={formatBoqNumber(item.qty)} />
          <DetailField label="Actual Qty (rolled up)" value={formatBoqNumber(item.actual_quantity)} />
          <DetailField label="HS Code" value={item.hs_code} />
          <Grid size={{ xs: 12, sm: 9 }}>
            <Typography variant="caption" color="text.secondary">
              HS Code Description
            </Typography>
            <Typography variant="body1">{item.hs_code_description || '—'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Currency
            </Typography>
            <Box>
              <Chip label={item.curr || '—'} size="small" />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader icon={<PaidOutlinedIcon fontSize="small" />} title="Cost breakdown" />
        <Grid container spacing={3}>
          <DetailField label="FOB" value={formatBoqNumber(item.fob_total, 4)} />
          <DetailField label="Landing" value={formatBoqNumber(item.landing, 4)} />
          <DetailField label="Insurance" value={formatBoqNumber(item.insurance, 4)} />
          <DetailField label="Customs Duty" value={formatBoqNumber(item.custom_duty, 4)} />
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Total DDP (PKR)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            PKR {formatBoqNumber(item.total_ddp_pkr)}
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <SectionHeader icon={<LocationOnOutlinedIcon fontSize="small" />} title="Installed at these sites" />
        {loadingTasks ? (
          <PageSkeleton />
        ) : tasks.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              py: 4,
              color: 'text.secondary',
            }}
          >
            <LocationOnOutlinedIcon sx={{ fontSize: 40, opacity: 0.4 }} />
            <Typography variant="body2">This item hasn&apos;t been assigned to any site yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Site</TableCell>
                  <TableCell>District</TableCell>
                  <TableCell align="right">Planned Qty</TableCell>
                  <TableCell align="right">Done</TableCell>
                  <TableCell align="right">Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => {
                  const planned = Number(task.planned_quantity) || 0;
                  const done = Number(task.cumulative_quantity) || 0;
                  const pct = planned > 0 ? Math.min(999, (done / planned) * 100) : 0;
                  const district = (task as SiteProgressTask & { site_district_name?: string })
                    .site_district_name;
                  return (
                    <TableRow key={task.id} hover>
                      <TableCell>{task.site_name}</TableCell>
                      <TableCell>{district || task.site_name}</TableCell>
                      <TableCell align="right">{formatBoqNumber(planned)}</TableCell>
                      <TableCell align="right">{formatBoqNumber(done)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          icon={pct >= 100 ? <CheckCircleOutlineIcon /> : undefined}
                          label={`${pct.toFixed(1)}%`}
                          color={pct >= 100 ? 'success' : pct > 0 ? 'warning' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}