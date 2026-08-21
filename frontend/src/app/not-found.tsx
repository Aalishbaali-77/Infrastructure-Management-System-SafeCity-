'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import SecurityIcon from '@mui/icons-material/Security';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

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
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <SecurityIcon sx={{ fontSize: 40, color: '#fff' }} />
        </Box>

        <Typography variant="h1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
          404
        </Typography>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Page Not Found
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you are looking for does not exist or you do not have permission to access it.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          onClick={() => router.push('/')}
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
