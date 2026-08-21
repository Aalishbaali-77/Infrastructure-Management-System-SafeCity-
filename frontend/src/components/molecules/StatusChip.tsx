import Chip from '@mui/material/Chip';

type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';

const statusColorMap: Record<string, ChipColor> = {
  PLANNED: 'default',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  CLOSED: 'default',
  CANCELLED: 'error',
  DRAFT: 'default',
  SUBMITTED: 'info',
  HOD_REVIEW: 'info',
  DIR_REVIEW: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  CONDITIONAL: 'warning',
  RETURNED: 'warning',
  PASSED: 'success',
  FAILED: 'error',
  PENDING: 'default',
};

interface StatusChipProps {
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  const color = statusColorMap[status] ?? 'default';

  return <Chip label={status.replace(/_/g, ' ')} color={color} size="small" />;
}
