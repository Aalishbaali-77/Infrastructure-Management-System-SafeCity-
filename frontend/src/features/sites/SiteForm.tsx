'use client';

import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import FormField from '@/components/molecules/FormField';
import type { CreateSiteDto } from '@/types/site';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetDistrictsQuery, useGetTownsQuery } from '@/store/api/provinceApi';

const siteSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  district_id: z.string().min(1, 'District is required'),
  town_id: z.string().min(1, 'Town is required'),
  name: z.string().min(1, 'Site name is required'),
  location: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  geofence_radius_m: z.coerce.number().optional(),
});

type SiteFormValues = z.infer<typeof siteSchema>;

interface SiteFormProps {
  defaultValues?: Partial<SiteFormValues>;
  onSubmit: (data: CreateSiteDto) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function SiteForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SiteFormProps) {
  const { data: projectsData } = useGetProjectsQuery({ page_size: 100 });
  const projects = projectsData?.data ?? [];

  const { control, handleSubmit, setValue } = useForm<
    z.input<typeof siteSchema>,
    unknown,
    z.output<typeof siteSchema>
  >({
    resolver: zodResolver(siteSchema),
    defaultValues,
  });

  const selectedProjectId = useWatch({ control, name: 'project_id' });
  const selectedDistrictId = useWatch({ control, name: 'district_id' });
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const provinceId = selectedProject?.province_id;

  const { data: districtsData } = useGetDistrictsQuery(
    { province_id: provinceId, page_size: 200 },
    { skip: !provinceId }
  );
  const { data: townsData } = useGetTownsQuery(
    { district_id: selectedDistrictId, page_size: 200 },
    { skip: !selectedDistrictId }
  );

  const districts = districtsData?.data ?? [];
  const towns = townsData?.data ?? [];

  const prevProjectId = useRef(selectedProjectId);
  const prevDistrictId = useRef(selectedDistrictId);

  useEffect(() => {
    if (prevProjectId.current !== selectedProjectId) {
      if (prevProjectId.current) {
        setValue('district_id', '');
        setValue('town_id', '');
      }
      prevProjectId.current = selectedProjectId;
    }
  }, [selectedProjectId, setValue]);

  useEffect(() => {
    if (prevDistrictId.current !== selectedDistrictId) {
      if (prevDistrictId.current) {
        setValue('town_id', '');
      }
      prevDistrictId.current = selectedDistrictId;
    }
  }, [selectedDistrictId, setValue]);

  const submitHandler = (data: SiteFormValues) => {
    const { district_id: _districtId, ...rest } = data;
    onSubmit(rest);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submitHandler)} noValidate>
      <FormField
        name="project_id"
        control={control}
        label="Project"
        variant="select"
        options={projects.map((p) => ({ label: p.name, value: p.id }))}
      />
      <FormField
        name="district_id"
        control={control}
        label={selectedProject ? 'District' : 'Select a project first'}
        variant="select"
        options={districts.map((d) => ({ label: d.name, value: d.id }))}
      />
      <FormField
        name="town_id"
        control={control}
        label={selectedDistrictId ? 'Town' : 'Select a district first'}
        variant="select"
        options={towns.map((t) => ({ label: t.name, value: t.id }))}
      />
      <FormField name="name" control={control} label="Site name" />
      <FormField name="location" control={control} label="Location" />
      <FormField name="latitude" control={control} label="Latitude" type="number" />
      <FormField name="longitude" control={control} label="Longitude" type="number" />
      <FormField
        name="geofence_radius_m"
        control={control}
        label="Geofence radius (m)"
        type="number"
      />
      <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save site'}
        </Button>
      </Stack>
    </Box>
  );
}
