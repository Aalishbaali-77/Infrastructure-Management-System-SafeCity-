// src/components/molecules/KpiCard.tsx
'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

interface KpiCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export default function KpiCard({ label, value, color = 'text.primary' }: KpiCardProps) {
  return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color, fontWeight: 700 }}>
        {value}
      </Typography>
    </Paper>
  );
}
