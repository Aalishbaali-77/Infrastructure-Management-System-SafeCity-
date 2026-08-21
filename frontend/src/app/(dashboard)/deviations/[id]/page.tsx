'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StatusChip from '@/components/molecules/StatusChip';
import Toast from '@/components/atoms/Toast';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import { usePermission } from '@/hooks/usePermission';
import { useGetDeviationQuery, useTransitionDeviationMutation } from '@/store/api/deviationApi';
import { useBreadcrumbLabel } from '@/contexts/BreadcrumbContext';
import type { DeviationSeverity, DeviationStatus } from '@/types/deviation';
import { formatDate } from '@/utils/formatDate';

const severityColor: Record<DeviationSeverity, 'error' | 'warning' | 'default'> = {
  CRITICAL: 'error',
  MAJOR: 'warning',
  MINOR: 'default',
};

// Which statuses this user's role can act on, and which target statuses are offered.
// Mirrors TRANSITION_RULES / CLOSE_ROLES in backend/apps/deviations/views.py.
function actionsForStatus(status: DeviationStatus, hasAnyRole: (roles: string[]) => boolean) {
  const actions: DeviationStatus[] = [];

  if (status === 'DRAFT' && hasAnyRole(['SITE_ENG', 'CONTRACTOR', 'HOD', 'QA', 'SYSTEM_ADMIN'])) {
    actions.push('SUBMITTED');
  }
  if (status === 'SUBMITTED' && hasAnyRole(['HOD', 'SYSTEM_ADMIN'])) {
    actions.push('HOD_REVIEW');
  }
  if (status === 'HOD_REVIEW' && hasAnyRole(['HOD', 'SYSTEM_ADMIN'])) {
    actions.push('APPROVED', 'REJECTED', 'CONDITIONAL', 'DIR_REVIEW');
  }
  if (status === 'DIR_REVIEW' && hasAnyRole(['DIR', 'SYSTEM_ADMIN'])) {
    actions.push('APPROVED', 'REJECTED', 'CONDITIONAL');
  }
  // Backend allows any status -> CLOSED for HOD/DIR/SYSTEM_ADMIN.
  if (status !== 'CLOSED' && hasAnyRole(['HOD', 'DIR', 'SYSTEM_ADMIN'])) {
    actions.push('CLOSED');
  }

  return actions;
}

export default function DeviationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasAnyRole } = usePermission();

  const { data: deviation, isLoading, isError, error, refetch } = useGetDeviationQuery(params.id);
  const pathname = usePathname();
useBreadcrumbLabel(pathname, deviation?.ncr_number);
  const [transitionDeviation, { isLoading: transitioning }] = useTransitionDeviationMutation();
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    document.title = 'Deviation Detail | SC-GIMS';
  }, []);

  if (isLoading) return <PageSkeleton />;

  if (isError || !deviation) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as { data?: { detail?: string } })?.data?.detail || 'Deviation not found.'}
        </Alert>
        <Button onClick={() => router.push('/deviations')}>Back to Deviations</Button>
      </Box>
    );
  }

  const availableActions = actionsForStatus(deviation.status, hasAnyRole);

  const handleTransition = async (nextStatus: DeviationStatus) => {
    try {
      await transitionDeviation({ id: deviation.id, status: nextStatus }).unwrap();
      setToast({ open: true, message: `Moved to ${nextStatus.replace(/_/g, ' ')}`, severity: 'success' });
      refetch();
    } catch (e) {
      setToast({
        open: true,
        message: (e as { data?: { detail?: string } })?.data?.detail || 'Transition failed.',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <IconButton
          onClick={() => router.back()}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h5" component="h1">
            {deviation.ncr_number}
          </Typography>
        </Box>
        <StatusChip status={deviation.status} />
        <Chip size="small" label={deviation.severity} color={severityColor[deviation.severity]} />
        <Chip size="small" variant="outlined" label={deviation.source} />
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Site</Typography>
            <Typography variant="body1">{deviation.site_name}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Task</Typography>
            <Typography variant="body1">{deviation.site_task_name || '—'}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Planned quantity</Typography>
            <Typography variant="body1">
              {deviation.planned_quantity !== null ? Number(deviation.planned_quantity).toLocaleString() : '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Actual quantity</Typography>
            <Typography variant="body1">
              {deviation.actual_quantity !== null ? Number(deviation.actual_quantity).toLocaleString() : '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Variance</Typography>
            <Typography variant="body1">
              {deviation.variance_quantity !== null ? Number(deviation.variance_quantity).toLocaleString() : '—'}
              {deviation.variance_pct !== null ? ` (${Number(deviation.variance_pct).toFixed(2)}%)` : ''}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">Raised by</Typography>
            <Typography variant="body1">{deviation.raised_by_name || '—'}</Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">Description</Typography>
            <Typography variant="body1">{deviation.description}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">Remarks</Typography>
            <Typography variant="body1">{deviation.remarks || '—'}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">Evidence</Typography>
            <Typography variant="body1">
              {deviation.evidence_document_ids.length > 0
                ? deviation.evidence_document_ids.join(', ')
                : '—'}
            </Typography>
          </Grid>

          {deviation.approved_by_name && (
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Approved by</Typography>
              <Typography variant="body1">
                {deviation.approved_by_name} — {deviation.approved_at ? formatDate(deviation.approved_at) : ''}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {availableActions.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Actions
          </Typography>
          <Stack direction="row" spacing={1}>
            {availableActions.map((next) => (
              <Button
                key={next}
                variant={next === 'APPROVED' ? 'contained' : 'outlined'}
                color={next === 'REJECTED' ? 'error' : next === 'APPROVED' ? 'success' : 'primary'}
                disabled={transitioning}
                onClick={() => handleTransition(next)}
              >
                {next.replace(/_/g, ' ')}
              </Button>
            ))}
          </Stack>
        </Paper>
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Box>
  );
}
