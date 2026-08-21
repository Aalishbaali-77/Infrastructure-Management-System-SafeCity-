'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import SecurityIcon from '@mui/icons-material/Security';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import { loginRequest } from '@/store/sagas/authSaga';
import { clearLoginError } from '@/store/slices/authSlice';
import Toast from '@/components/atoms/Toast';
import type { RootState } from '@/store';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Shared animation definitions (disabled for reduced-motion below)
const animations = {
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(16px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
};

// Shared input styling: rounded corners, hover border, focus glow,
// and a fix for Chrome's gray autofill background.
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    transition: 'box-shadow 0.25s ease',
    '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(25,118,210,0.12)',
    },
  },
  // Chrome autofill paints a gray-blue background that ignores normal CSS.
  // This inset shadow trick repaints it white and keeps the text color normal.
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
    WebkitBoxShadow: '0 0 0 1000px #fff inset',
    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
    caretColor: 'rgba(0, 0, 0, 0.87)',
    borderRadius: 'inherit',
  },
};

const features = [
  { icon: <LocationCityIcon />, text: 'Multi-province site management' },
  { icon: <CameraAltIcon />, text: 'CCTV & fiber tracking' },
  { icon: <NetworkCheckIcon />, text: 'Real-time progress monitoring' },
  { icon: <SecurityIcon />, text: 'Government-grade compliance' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const loginError = useSelector((state: RootState) => state.auth.loginError);
  const userRole = useSelector((state: RootState) => state.auth.user?.roles?.[0]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    dispatch(loginRequest(data));
  };

  useEffect(() => {
    if (isAuthenticated && userRole) {
      router.push(`/${userRole.toLowerCase()}`);
    }
  }, [isAuthenticated, userRole, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        ...animations,
        '@media (prefers-reduced-motion: reduce)': {
          '& *': { animation: 'none !important', transition: 'none !important' },
        },
      }}
    >
      {/* Left Panel — desktop only */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          bgcolor: 'primary.main',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { md: 5, lg: 6 },
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 20% 15%, rgba(255,255,255,0.10) 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(0,0,0,0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
          },
          '& > *': { position: 'relative' },
        }}
      >
        <SecurityIcon
          sx={{
            fontSize: 64,
            mb: 3,
            opacity: 0.9,
            animation: 'fadeUp 0.6s ease-out both',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'scale(1.08)' },
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            textAlign: 'center',
            letterSpacing: 1,
            animation: 'fadeUp 0.6s ease-out 0.1s both',
          }}
        >
          SC-GIMS
        </Typography>
        <Typography
          variant="h6"
          sx={{
            opacity: 0.85,
            mb: 4,
            textAlign: 'center',
            maxWidth: 480,
            animation: 'fadeUp 0.6s ease-out 0.2s both',
          }}
        >
          Safe Cities Government Infrastructure Monitoring System
        </Typography>

        <Divider
          sx={{
            bgcolor: 'rgba(255,255,255,0.3)',
            width: '80%',
            maxWidth: 480,
            mb: 4,
            animation: 'fadeIn 0.8s ease-out 0.3s both',
          }}
        />

        <Typography
          variant="body2"
          sx={{
            opacity: 0.7,
            mb: 3,
            textAlign: 'center',
            animation: 'fadeUp 0.6s ease-out 0.35s both',
          }}
        >
          Monitoring infrastructure across Pakistan Safe Cities Program
        </Typography>

        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 320 }}
        >
          {features.map((item, index) => (
            <Box
              key={item.text}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                opacity: 0.85,
                px: 2,
                py: 1.25,
                borderRadius: 2,
                cursor: 'default',
                animation: `fadeUp 0.5s ease-out ${0.45 + index * 0.1}s both`,
                transition: 'background-color 0.25s ease, transform 0.25s ease, opacity 0.25s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.12)',
                  transform: 'translateX(6px)',
                  opacity: 1,
                },
              }}
            >
              {item.icon}
              <Typography variant="body2">{item.text}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 6, opacity: 0.5, animation: 'fadeIn 1s ease-out 0.9s both' }}>
          <Typography variant="caption" sx={{ letterSpacing: 2, textTransform: 'uppercase' }}>
            Sindh · Punjab · Balochistan
          </Typography>
        </Box>
      </Box>

      {/* Right Panel — blue branded backdrop on mobile, light gray on desktop */}
      <Box
        sx={{
          flex: { xs: 1, md: 0.6 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2, sm: 4 },
          bgcolor: { xs: 'primary.main', md: '#f5f5f5' },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.10) 0%, transparent 55%), radial-gradient(ellipse at 85% 95%, rgba(0,0,0,0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
            display: { xs: 'block', md: 'none' },
          },
          '& > *': { position: 'relative' },
        }}
      >
        {/* Mobile branding — above the card, on the blue backdrop */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column',
            alignItems: 'center',
            color: '#fff',
            mb: 3,
            textAlign: 'center',
            animation: 'fadeUp 0.6s ease-out both',
          }}
        >
          <SecurityIcon sx={{ fontSize: 48, mb: 1, opacity: 0.95 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            SC-GIMS
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 320, mt: 0.5 }}>
            Safe Cities Government Infrastructure Monitoring System
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            width: '100%',
            maxWidth: 420,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: {
              xs: '0 12px 40px rgba(0,0,0,0.25)',
              md: '0 4px 24px rgba(0,0,0,0.06)',
            },
            animation: 'fadeUp 0.5s ease-out 0.15s both',
            transition: 'box-shadow 0.3s ease',
            '&:hover': { boxShadow: { md: '0 8px 32px rgba(0,0,0,0.10)' } },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to your government account
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('email')}
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              placeholder="name@gov.pk"
              autoComplete="email"
              sx={inputSx}
            />

            <TextField
              {...register('password')}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              autoComplete="current-password"
              sx={inputSx}
            />
            <Box sx={{ textAlign: 'right', mt: 0.5 }}>
              <Typography
                variant="body2"
                component="a"
                href="/forgot-password"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Forgot password?
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              size="large"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(25,118,210,0.35)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 6px rgba(25,118,210,0.3)',
                },
              }}
            >
              {isSubmitting ? 'Signing in…' : 'Log In'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Alert severity="info" sx={{ borderRadius: 2, alignItems: 'flex-start' }}>
            <Typography variant="caption">
              Access is restricted to authorized government personnel only. Contact your System
              Administrator to request access.
            </Typography>
          </Alert>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            SC-GIMS v1.0.0 · Official Government Use Only
          </Typography>
        </Paper>

        {/* Mobile footer — provinces line under the card */}
        <Typography
          variant="caption"
          sx={{
            display: { xs: 'block', md: 'none' },
            color: 'rgba(255,255,255,0.6)',
            mt: 3,
            letterSpacing: 2,
            textTransform: 'uppercase',
            animation: 'fadeIn 1s ease-out 0.5s both',
          }}
        >
          Sindh · Punjab · Balochistan
        </Typography>
      </Box>

      <Toast
        open={!!loginError}
        message={loginError ?? ''}
        severity="error"
        onClose={() => dispatch(clearLoginError())}
      />
    </Box>
  );
}
