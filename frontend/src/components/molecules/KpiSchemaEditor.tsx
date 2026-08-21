'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { slugify } from '@/utils/slugify';
import type { KpiValueType, ProgressKpiField } from '@/types/dailyProgress';

interface KpiSchemaEditorProps {
  value: ProgressKpiField[];
  onChange: (fields: ProgressKpiField[]) => void;
  disabled?: boolean;
}

const KPI_TYPE_OPTIONS: { value: KpiValueType; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'string', label: 'Text' },
];

export default function KpiSchemaEditor({ value, onChange, disabled = false }: KpiSchemaEditorProps) {
  const updateRow = (index: number, patch: Partial<ProgressKpiField>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const renameRow = (index: number, label: string) => {
    onChange(
      value.map((row, i) => (i === index ? { ...row, label, key: row.key || slugify(label) } : row))
    );
  };

  const addRow = () => {
    onChange([...value, { key: '', label: '', value_type: 'number' }]);
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Subtasks / KPIs
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Optional checklist items (e.g. Digging, Foundation, Installation) logged per day.
      </Typography>

      {value.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          No subtasks configured.
        </Typography>
      )}

      <Stack spacing={1.5} sx={{ mb: 1.5 }}>
        {value.map((row, index) => (
          <Grid container spacing={1} key={index} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Subtask name"
                value={row.label}
                onChange={(e) => renameRow(index, e.target.value)}
                fullWidth
                size="small"
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 8, sm: 4 }}>
              <TextField
                select
                label="Type"
                value={row.value_type}
                onChange={(e) => updateRow(index, { value_type: e.target.value as KpiValueType })}
                fullWidth
                size="small"
                disabled={disabled}
              >
                {KPI_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 4, sm: 2 }} sx={{ textAlign: 'right' }}>
              <IconButton
                onClick={() => removeRow(index)}
                disabled={disabled}
                size="small"
                aria-label="Remove subtask"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Stack>

      <Button startIcon={<AddIcon />} onClick={addRow} disabled={disabled} size="small">
        Add subtask
      </Button>
    </Box>
  );
}
