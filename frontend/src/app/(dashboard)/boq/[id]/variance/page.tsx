'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';
import { useBreadcrumbLabel } from '@/contexts/BreadcrumbContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { useGetBoqItemsQuery, useGetBoqQuery } from '@/store/api/boqApi';
import { formatBoqNumber } from '@/lib/boq/spreadsheet';

function escapeCsvValue(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

type VarianceStatus = 'over' | 'under' | 'on_track';

const STATUS_LABEL: Record<VarianceStatus, string> = {
  over: 'Over plan',
  under: 'Behind',
  on_track: 'On track',
};

const STATUS_COLOR: Record<VarianceStatus, 'error' | 'warning' | 'success'> = {
  over: 'error',
  under: 'warning',
  on_track: 'success',
};

export default function BOQVariancePage() {
  const params = useParams();
  const router = useRouter();
  const boqId = String(params.id);

  const { data: boq, isLoading, isError } = useGetBoqQuery(boqId);
  useBreadcrumbLabel(`/boq/${boqId}`, boq?.project_name ? `${boq.project_name} — BOQ` : undefined);
  const { data: itemsData, isLoading: loadingItems } = useGetBoqItemsQuery(boqId);

  const [statusFilter, setStatusFilter] = useState<VarianceStatus | null>(null);

  useEffect(() => {
    document.title = 'BOQ Variance | SC-GIMS';
  }, []);

  const items = itemsData?.data ?? [];

  const getStatus = (row: (typeof items)[number]): VarianceStatus => {
    const diff = Number(row.actual_quantity) - Number(row.qty);
    if (diff > 0) return 'over';
    if (diff < 0) return 'under';
    return 'on_track';
  };

  const getPercentComplete = (row: (typeof items)[number]): number => {
    const planned = Number(row.qty);
    const actual = Number(row.actual_quantity);
    if (planned <= 0) return 0;
    return (actual / planned) * 100;
  };

  const displayedItems = statusFilter ? items.filter((i) => getStatus(i) === statusFilter) : items;

  // Chart data mirrors displayedItems exactly — clicking a summary card
  // filters the chart the same way it already filters the table below,
  // so the two stay in sync. Sorted worst-to-best; nothing is capped or
  // dropped, the container scrolls once the list gets long.
  const rankedItemsData = useMemo(() => {
    return [...displayedItems]
      .map((row) => ({
        name: row.item,
        pctComplete: Math.round(getPercentComplete(row) * 10) / 10,
        status: getStatus(row),
      }))
      .sort((a, b) => a.pctComplete - b.pctComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedItems]);

  if (isLoading || loadingItems) return <PageSkeleton />;

  if (isError || !boq) {
    return (
      <Box>
        <Alert severity="error">BOQ not found.</Alert>
        <Button onClick={() => router.push('/boq')} sx={{ mt: 2 }}>
          Back to BOQ
        </Button>
      </Box>
    );
  }

  const over = items.filter((i) => getStatus(i) === 'over').length;
  const under = items.filter((i) => getStatus(i) === 'under').length;
  const onTrack = items.filter((i) => getStatus(i) === 'on_track').length;
  const totalDdpPkr = items.reduce((sum, i) => sum + Number(i.total_ddp_pkr || 0), 0);

  const handleDownloadCsv = () => {
    const headers = [
      'Item',
      'Item Type',
      'Item Description',
      'Unit',
      'Planned Qty',
      'Actual Qty',
      'Variance',
      'Variance %',
      '% Complete',
      'Status',
      'Total DDP PKR',
    ];
    const rows = items.map((row) => {
      const qty = Number(row.qty);
      const actual = Number(row.actual_quantity);
      const variance = actual - qty;
      const variancePct = qty === 0 ? 0 : (variance / qty) * 100;
      return [
        row.item,
        row.item_type || '',
        row.item_description,
        row.unit,
        qty,
        actual,
        variance,
        `${variancePct.toFixed(1)}%`,
        `${getPercentComplete(row).toFixed(1)}%`,
        STATUS_LABEL[getStatus(row)],
        row.total_ddp_pkr,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boq-variance-${boq.project_name.replace(/\s+/g, '-')}-v${boq.version}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryCards: {
    key: VarianceStatus;
    label: string;
    count: number;
    color: 'error' | 'warning' | 'success';
    icon: React.ReactNode;
  }[] = [
    { key: 'over', label: 'Over plan', count: over, color: 'error', icon: <TrendingUpIcon /> },
    { key: 'under', label: 'Under plan', count: under, color: 'warning', icon: <TrendingDownIcon /> },
    { key: 'on_track', label: 'On track', count: onTrack, color: 'success', icon: <CheckCircleIcon /> },
  ];

  return (
    <Box>
      {/* Header row: back icon left, download pill right */}
      <Stack direction="row" sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton
          onClick={() => router.push(`/boq/${boqId}`)}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Button
          startIcon={<DownloadIcon />}
          variant="outlined"
          onClick={handleDownloadCsv}
          sx={{
            borderRadius: 999,
            px: 2.5,
            py: 0.75,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              borderColor: 'primary.main',
            },
          }}
        >
          Download CSV
        </Button>
      </Stack>

      {/* Title block, own row */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Variance — {boq.project_name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Total DDP: PKR {formatBoqNumber(totalDdpPkr)}
        </Typography>
      </Box>

      {/* Clickable summary cards — drive both the table and the chart below */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => {
          const isActive = statusFilter === card.key;
          return (
            <Grid key={card.key} size={{ xs: 12, sm: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  borderLeft: '4px solid',
                  borderLeftColor: `${card.color}.main`,
                  borderRadius: 2,
                  bgcolor: isActive ? alpha('#000', 0.03) : 'background.paper',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <CardActionArea
                  onClick={() => setStatusFilter(isActive ? null : card.key)}
                  sx={{ px: 1 }}
                >
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
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {card.label}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }} color={`${card.color}.main`}>
                          {card.count}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {items.length === 0 ? (
        <Alert severity="info">No items to compare.</Alert>
      ) : (
        <>
          {/* Ranked completion chart — every displayed item, sorted worst to
              best. Follows statusFilter, so clicking a summary card above
              filters this chart the same way it filters the table below. */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {statusFilter ? `${STATUS_LABEL[statusFilter]} items` : 'All items'}, sorted by completion
              </Typography>
              {statusFilter && (
                <Button size="small" onClick={() => setStatusFilter(null)} sx={{ textTransform: 'none' }}>
                  Clear filter
                </Button>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              {rankedItemsData.length} item{rankedItemsData.length === 1 ? '' : 's'}
              {rankedItemsData.length > 10 ? ' · scroll to see more' : ''}
            </Typography>

            {rankedItemsData.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No items match this filter.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <Stack spacing={0.75}>
                  {rankedItemsData.map((row, i) => (
                    <Box
                      key={`${row.name}-${i}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr 48px',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={row.name}
                      >
                        {row.name}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, row.pctComplete)}
                        color={STATUS_COLOR[row.status]}
                        sx={{ height: 10, borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {row.pctComplete}%
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>

          <Stack direction="row" sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" color="text.secondary">
              {statusFilter
                ? `Showing ${displayedItems.length} ${STATUS_LABEL[statusFilter].toLowerCase()} item(s)`
                : `Showing all ${items.length} items`}
            </Typography>
            {statusFilter && (
              <Button size="small" onClick={() => setStatusFilter(null)} sx={{ textTransform: 'none' }}>
                Clear filter
              </Button>
            )}
          </Stack>

          <Paper sx={{ p: 2, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'ITEM',
                    'ITEM TYPE',
                    'Item Description',
                    'UNIT',
                    'QTY',
                    'Actual',
                    'Progress',
                    'Status',
                    'Variance',
                    'Variance %',
                    'TotalDDP PKR',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 10,
                        textAlign: 'left',
                        borderBottom: '1px solid #ddd',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((row) => {
                  const variance = Number(row.actual_quantity) - Number(row.qty);
                  const variancePct =
                    Number(row.qty) === 0 ? '0.0' : ((variance / Number(row.qty)) * 100).toFixed(1);
                  const isOver = variance > 0;
                  const status = getStatus(row);
                  const pctComplete = Math.min(100, getPercentComplete(row));
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 10 }}>{row.item}</td>
                      <td style={{ padding: 10 }}>{row.item_type || '—'}</td>
                      <td style={{ padding: 10 }}>{row.item_description}</td>
                      <td style={{ padding: 10 }}>{row.unit}</td>
                      <td style={{ padding: 10 }}>{formatBoqNumber(row.qty)}</td>
                      <td style={{ padding: 10 }}>{formatBoqNumber(row.actual_quantity)}</td>
                      <td style={{ padding: 10, minWidth: 120 }}>
                        <LinearProgress
                          variant="determinate"
                          value={pctComplete}
                          color={STATUS_COLOR[status]}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </td>
                      <td style={{ padding: 10 }}>
                        <Chip size="small" label={STATUS_LABEL[status]} color={STATUS_COLOR[status]} />
                      </td>
                      <td
                        style={{
                          padding: 10,
                          color: isOver ? '#d32f2f' : '#388e3c',
                          fontWeight: 600,
                        }}
                      >
                        {isOver ? '+' : ''}
                        {formatBoqNumber(variance)}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          color: isOver ? '#d32f2f' : '#388e3c',
                          fontWeight: 600,
                        }}
                      >
                        {isOver ? '+' : ''}
                        {variancePct}%
                      </td>
                      <td style={{ padding: 10 }}>{formatBoqNumber(row.total_ddp_pkr)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Paper>
        </>
      )}
    </Box>
  );
}