'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '@/services/authService';
import { tokenService } from '@/services/tokenService';
import {
  logout,
  setAccessToken,
  setBootstrapped,
  setUser,
} from '@/store/slices/authSlice';
import { setModulesFromApi } from '@/store/slices/permissionsSlice';
import type { RootState } from '@/store';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const bootstrapped = useSelector((s: RootState) => s.auth.bootstrapped);
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const refresh = tokenService.getRefreshToken();
      if (!refresh) {
        dispatch(setBootstrapped());
        return;
      }
      try {
        const tokens = await authService.refresh(refresh);
        if (cancelled) return;
        tokenService.setAccessToken(tokens.accessToken);
        tokenService.setRefreshToken(tokens.refreshToken);
        dispatch(setAccessToken(tokens.accessToken));
        const user = await authService.me(tokens.accessToken);
        if (cancelled) return;
        dispatch(setUser(user));

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/permissions/`,
          { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
        );
        if (res.ok) {
          const body = await res.json();
          if (body?.data) dispatch(setModulesFromApi(body.data));
        }
      } catch {
        if (!cancelled) {
          tokenService.clear();
          dispatch(logout());
        }
      } finally {
        if (!cancelled) dispatch(setBootstrapped());
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !bootstrapped) return;
    const token = tokenService.getAccessToken();
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/permissions/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (body?.data) dispatch(setModulesFromApi(body.data));
      })
      .catch(() => undefined);
  }, [isAuthenticated, bootstrapped, dispatch]);

  if (!bootstrapped) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
