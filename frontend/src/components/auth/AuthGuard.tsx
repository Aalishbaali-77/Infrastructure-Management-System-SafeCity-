'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const bootstrapped = useSelector((state: RootState) => state.auth.bootstrapped);
  const roles = useSelector((state: RootState) => state.auth.user?.roles ?? []);
  const modulePermissions = useSelector((state: RootState) => state.permissions.modules);

  const matchedModule = modulePermissions.find((m) => pathname.startsWith(m.key));
  const hasModuleAccess =
    !matchedModule ||
    roles.includes('SYSTEM_ADMIN') ||
    matchedModule.allowedRoles.some((r) => roles.includes(r));
  const adminDenied = pathname.startsWith('/admin') && !roles.includes('SYSTEM_ADMIN');

  useEffect(() => {
    if (!bootstrapped) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (adminDenied || !hasModuleAccess) {
      router.replace('/access-denied');
    }
  }, [bootstrapped, isAuthenticated, adminDenied, hasModuleAccess, router]);

  if (!bootstrapped || !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (adminDenied || !hasModuleAccess) {
    return null;
  }

  return <>{children}</>;
}
