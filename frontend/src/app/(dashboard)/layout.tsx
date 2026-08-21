import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayoutTemplate from '@/components/templates/DashboardLayout';
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext';

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <BreadcrumbProvider>
        <DashboardLayoutTemplate>{children}</DashboardLayoutTemplate>
      </BreadcrumbProvider>
    </AuthGuard>
  );
}
