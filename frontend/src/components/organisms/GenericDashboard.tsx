'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import type { RootState } from '@/store';
import { useGetRolesQuery } from '@/store/api/userApi';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WidgetsIcon from '@mui/icons-material/Widgets';

interface GenericDashboardProps {
  roleName: string;
}

export default function GenericDashboard({ roleName }: GenericDashboardProps) {
  const router = useRouter();
  const { data: roles = [] } = useGetRolesQuery();
  const modules = useSelector((state: RootState) => state.permissions.modules);

  const role = roles.find((r) => r.name === roleName);
  const accessibleModules = modules.filter((m) => m.allowedRoles.includes(roleName));

  useEffect(() => {
    document.title = `${role?.label ?? roleName} Dashboard | SC-GIMS`;
  }, [role, roleName]);

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        {role?.label ?? roleName} Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Welcome. Below are the modules you have access to.
      </Typography>

      {accessibleModules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No modules have been assigned to your role yet. Please contact your System
            Administrator.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {accessibleModules.map((mod) => (
            <Grid key={mod.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                onClick={() => router.push(mod.key)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                  '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                }}
              >
                <WidgetsIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {mod.label}
                </Typography>
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
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
