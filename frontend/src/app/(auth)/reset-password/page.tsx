'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const schema = z
  .object({
    otp: z.string().min(6, 'Enter the 6-digit code').max(6, 'Enter the 6-digit code'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormValues) => {
    // Dummy: pretend password was reset. Real backend call goes here later.
    console.log('Reset password for:', email, data);
    router.push('/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#f5f5f5',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Reset password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter the code sent to {email || 'your email'} and choose a new password.
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register('otp')}
            label="6-digit code"
            fullWidth
            margin="normal"
            error={!!errors.otp}
            helperText={errors.otp?.message}
          />
          <TextField
            {...register('new_password')}
            label="New password"
            type="password"
            fullWidth
            margin="normal"
            error={!!errors.new_password}
            helperText={errors.new_password?.message}
          />
          <TextField
            {...register('confirm_password')}
            label="Confirm new password"
            type="password"
            fullWidth
            margin="normal"
            error={!!errors.confirm_password}
            helperText={errors.confirm_password?.message}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            size="large"
            sx={{ mt: 2 }}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
