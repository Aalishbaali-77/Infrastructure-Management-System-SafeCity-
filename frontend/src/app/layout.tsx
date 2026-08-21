import type { Metadata } from 'next';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './globals.css';
import ThemeRegistry from '@/theme/ThemeRegistry';
import StoreProvider from '@/store/StoreProvider';
import AuthBootstrap from '@/components/auth/AuthBootstrap';

export const metadata: Metadata = {
  title: 'SC-GIMS',
  description: 'Safe Cities Government Infrastructure Monitoring System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <ThemeRegistry>
            <AuthBootstrap>{children}</AuthBootstrap>
          </ThemeRegistry>
        </StoreProvider>
      </body>
    </html>
  );
}
