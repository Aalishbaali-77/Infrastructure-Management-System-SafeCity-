'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SettingsIcon from '@mui/icons-material/Settings';
import PublicIcon from '@mui/icons-material/Public';
import EngineeringIcon from '@mui/icons-material/Engineering';

interface ModuleCard {
  title: string;
  icon: React.ReactNode;
  href: string;
  available: boolean;
}

const moduleCards: ModuleCard[] = [
  {
    title: 'User Management',
    icon: <PeopleIcon fontSize="large" />,
    href: '/admin/users',
    available: true,
  },
  {
    title: 'Role & Module Permissions',
    icon: <SecurityIcon fontSize="large" />,
    href: '/admin/permissions',
    available: true,
  },
  {
    title: 'Province, District & Town Management',
    icon: <PublicIcon fontSize="large" />,
    href: '/admin/provinces',
    available: true,
  },
  {
    title: 'Progress Tasks & KPIs',
    icon: <EngineeringIcon fontSize="large" />,
    href: '/admin/progress-tasks',
    available: true,
  },
  {
    title: 'Workflow Configuration',
    icon: <AccountTreeIcon fontSize="large" />,
    href: '/admin/workflows',
    available: false,
  },
  {
    title: 'System Settings',
    icon: <SettingsIcon fontSize="large" />,
    href: '/admin/settings',
    available: false,
  },
];

export default function SystemAdminDashboard() {
  const router = useRouter();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  useEffect(() => {
    document.title = 'System Admin Dashboard | SC-GIMS';
  }, []);

  const handleCardClick = (card: ModuleCard) => {
    if (card.available) {
      router.push(card.href);
    } else {
      setComingSoonOpen(true);
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        System Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {moduleCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              onClick={() => handleCardClick(card)}
              sx={{
                p: 3,
                height: 190,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 3,
                cursor: card.available ? 'pointer' : 'not-allowed',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                ...(card.available && {
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                  },
                }),
              }}
            >
              {!card.available && (
                <Chip
                  label="Coming Soon"
                  size="small"
                  sx={{ position: 'absolute', top: 12, right: 12 }}
                />
              )}

              <Box
                sx={{
                  color: card.available ? 'primary.main' : 'text.disabled',
                }}
              >
                {card.icon}
              </Box>

              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: card.available ? 'text.primary' : 'text.disabled',
                  }}
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="caption"
                  color={card.available ? 'text.secondary' : 'text.disabled'}
                  sx={{ display: 'block', mt: 0.5 }}
                ></Typography>
              </Box>

              {card.available && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'primary.main',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Open
                  </Typography>
                  <ArrowForwardIcon fontSize="small" />
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={comingSoonOpen}
        autoHideDuration={2500}
        onClose={() => setComingSoonOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setComingSoonOpen(false)} sx={{ borderRadius: 2 }}>
          This feature is coming soon.
        </Alert>
      </Snackbar>
    </Box>
  );
}
