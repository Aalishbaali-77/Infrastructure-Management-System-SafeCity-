'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export default function DashboardRootPage() {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userRole = useSelector((state: RootState) => state.auth.user?.roles?.[0]);

  useEffect(() => {
    if (isAuthenticated && userRole) {
      router.replace(`/${userRole.toLowerCase()}`);
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, userRole, router]);

  return null;
}
