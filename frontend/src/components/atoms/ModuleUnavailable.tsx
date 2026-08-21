'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

export default function ModuleUnavailable({
  title,
  description = 'This module has no backend API yet. Core data (projects, sites, BOQ, users) is live from the API.',
}: {
  title: string;
  description?: string;
}) {
  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">{description}</Alert>
      </Paper>
    </Box>
  );
}
