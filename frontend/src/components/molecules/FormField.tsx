'use client';

import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface SelectOption {
  label: string;
  value: string;
}

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  variant?: 'text' | 'select' | 'date';
  options?: SelectOption[];
  type?: string;
  fullWidth?: boolean;
}

export default function FormField<T extends FieldValues>({
  name,
  control,
  label,
  variant = 'text',
  options = [],
  type = 'text',
  fullWidth = true,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        if (variant === 'select') {
          return (
            <TextField
              {...field}
              select
              label={label}
              fullWidth={fullWidth}
              margin="normal"
              error={!!error}
              helperText={error?.message}
            >
              {options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          );
        }

        if (variant === 'date') {
          // The form stores dates as plain "YYYY-MM-DD" strings (matches
          // the Zod schemas), but DatePicker needs a dayjs object — convert
          // both directions here so the rest of the form never has to care.
          const dateValue = field.value ? dayjs(field.value as string) : null;

          return (
            <DatePicker
              label={label}
              value={dateValue}
              format="DD-MMM-YYYY"
              onChange={(newValue) => {
                field.onChange(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '');
              }}
              slotProps={{
                textField: {
                  fullWidth,
                  margin: 'normal',
                  error: !!error,
                  helperText: error?.message,
                },
              }}
            />
          );
        }

        return (
          <TextField
            {...field}
            label={label}
            type={type}
            fullWidth={fullWidth}
            margin="normal"
            error={!!error}
            helperText={error?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        );
      }}
    />
  );
}
