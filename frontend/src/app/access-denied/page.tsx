'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import BlockIcon from '@mui/icons-material/Block';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export default function AccessDenied() {
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.user?.roles?.[0]);
  const dashboardHref = role ? `/${role.toLowerCase()}` : '/';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8f9fa',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '20px',
            bgcolor: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <BlockIcon sx={{ fontSize: 40, color: '#fff' }} />
        </Box>

        <Typography variant="h1" sx={{ fontWeight: 800, color: 'error.main', mb: 1 }}>
          403
        </Typography>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          You do not have permission to access this page. If you believe this is a mistake, contact
          your System Administrator.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          onClick={() => router.push(dashboardHref)}
          sx={{
            borderRadius: 2,
            py: 1.5,
            px: 4,
            fontWeight: 700,
          }}
        >
          Back to Dashboard
        </Button>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 4 }}>
          SC-GIMS · Safe Cities Government Infrastructure Monitoring System
        </Typography>
      </Paper>
    </Box>
  );
}
