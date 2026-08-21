'use client';
import ExecutiveDashboard from '@/components/organisms/ExecutiveDashboard';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DASHBOARD_CONFIG, UserRole } from '../dashboardConfig';
import HODDashboard from '@/components/organisms/HODDashboard';
import DirectorDashboard from '@/components/organisms/DirectorDashboard';
import SiteEngDashboard from '@/components/organisms/SiteEngDashboard';
import ContractorDashboard from '@/components/organisms/ContractorDashboard';
import QADashboard from '@/components/organisms/QADashboard';
import VendorDashboard from '@/components/organisms/VendorDashboard';
import AuditorDashboard from '@/components/organisms/AuditorDashboard';
import SystemAdminDashboard from '@/components/organisms/SystemAdminDashboard';
import { useGetRolesQuery } from '@/store/api/userApi';
import GenericDashboard from '@/components/organisms/GenericDashboard';

export default function RoleDashboard() {
  const params = useParams();
  const roleParam = (params.role as string)?.toUpperCase() as UserRole;
  const { data: roles = [] } = useGetRolesQuery();
  const knownRole = roles.find((r) => r.name === roleParam);

  const config = DASHBOARD_CONFIG[roleParam];

  if (!config) {
    if (knownRole) {
      return <GenericDashboard roleName={roleParam} />;
    }
    return (
      <Box>
        <Typography variant="h5">Unknown role: {params.role}</Typography>
      </Box>
    );
  }

  if (roleParam === 'EXEC') {
    return <ExecutiveDashboard />;
  }

  if (roleParam === 'HOD') {
    return <HODDashboard />;
  }

  if (roleParam === 'VENDOR') {
    return <VendorDashboard />;
  }

  if (roleParam === 'DIR') {
    return <DirectorDashboard />;
  }

  if (roleParam === 'SITE_ENG') {
    return <SiteEngDashboard />;
  }

  if (roleParam === 'CONTRACTOR') {
    return <ContractorDashboard />;
  }

  if (roleParam === 'QA') {
    return <QADashboard />;
  }

  if (roleParam === 'AUDITOR') {
    return <AuditorDashboard />;
  }

  if (roleParam === 'SYSTEM_ADMIN') {
    return <SystemAdminDashboard />;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {config.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Widgets to build: {config.widgets.join(', ')}
      </Typography>
    </Box>
  );
}
