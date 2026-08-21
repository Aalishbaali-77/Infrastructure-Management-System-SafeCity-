'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import SiteForm from '@/features/sites/SiteForm';
import type { CreateSiteDto } from '@/types/site';

export default function NewSitePage() {
  const [submittedData, setSubmittedData] = useState<CreateSiteDto | null>(null);

  const handleSubmit = (data: CreateSiteDto) => {
    console.log('Site form submitted:', data);
    setSubmittedData(data);
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Create New Site
      </Typography>

      {submittedData && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Saved! Check the browser console to see the data.
        </Alert>
      )}

      <SiteForm
        defaultValues={{
          project_id: '',
          district_id: '',
          town_id: '',
          name: '',
          location: '',
          geofence_radius_m: 500,
        }}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
