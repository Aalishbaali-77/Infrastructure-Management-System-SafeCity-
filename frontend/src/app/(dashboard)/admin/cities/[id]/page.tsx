'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

/** Legacy /admin/cities/:id → /admin/towns/:id */
export default function CityRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) router.replace(`/admin/towns/${id}`);
  }, [id, router]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
      <CircularProgress size={32} />
      <Typography variant="body2" color="text.secondary">
        Redirecting to town…
      </Typography>
    </Box>
  );
}
