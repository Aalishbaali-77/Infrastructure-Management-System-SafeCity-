'use client';

import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import FormField from '@/components/molecules/FormField';
import type { CreateProjectDto } from '@/types/project';
import { useGetProvincesQuery } from '@/store/api/provinceApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';

const projectSchema = z
  .object({
    name: z.string().min(1, 'Project name is required'),
    province_id: z.string().min(1, 'Province is required'),
    program_code: z.string().optional(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional(),
    budget: z.string().optional(),
  })
  .refine((data) => !data.end_date || data.end_date >= data.start_date, {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (data: CreateProjectDto) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export default function ProjectForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}: ProjectFormProps) {
  const { data: provincesData } = useGetProvincesQuery({ page_size: 100 });
  const { data: projectsData } = useGetProjectsQuery({ page_size: 100 });

  const provinces = provincesData?.data ?? [];
  const projects = projectsData?.data ?? [];

  const { control, handleSubmit, setValue, getValues } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  });
  const lastAutoCodeRef = useRef<string | null>(null);
  const selectedProvinceId = useWatch({ control, name: 'province_id' });

  useEffect(() => {
    if (isEditing || !selectedProvinceId) return;
    const currentCode = getValues('program_code');
    if (currentCode && currentCode !== lastAutoCodeRef.current) return;

    const province = provinces.find((p) => p.id === selectedProvinceId);
    if (!province) return;
    const count = projects.filter((p) => p.province_id === selectedProvinceId).length;
    const generated = `${province.code || 'PRJ'}-${String(count + 1).padStart(3, '0')}`;
    lastAutoCodeRef.current = generated;
    setValue('program_code', generated);
  }, [selectedProvinceId, provinces, projects, isEditing, getValues, setValue]);

  const submitHandler = (data: ProjectFormValues) => {
    onSubmit({
      name: data.name,
      province_id: data.province_id,
      program_code: data.program_code,
      start_date: data.start_date,
      end_date: data.end_date || undefined,
      budget: data.budget ? Number(data.budget) : undefined,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submitHandler)} noValidate>
      <FormField name="name" control={control} label="Project name" />
      <FormField
        name="province_id"
        control={control}
        label="Province"
        variant="select"
        options={provinces.map((p) => ({ label: p.name, value: p.id }))}
      />
      <FormField name="program_code" control={control} label="Program code" />
      <FormField name="start_date" control={control} label="Start date" type="date" />
      <FormField name="end_date" control={control} label="End date" type="date" />
      <FormField name="budget" control={control} label="Budget" type="number" />
      <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create project'}
        </Button>
      </Stack>
    </Box>
  );
}
