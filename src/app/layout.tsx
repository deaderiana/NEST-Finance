import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FinanceProvider } from '@/context/FinanceContext';

export const metadata: Metadata = {
  title: 'NEST Finance - Family Finance Management',
  description: 'Aplikasi manajemen keuangan rumah tangga pasangan dengan integritas buku besar dan gaya claymorphism.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#EBF1F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#EBF1F6] text-slate-800 min-h-screen select-none">
        <FinanceProvider>{children}</FinanceProvider>
      </body>
    </html>
  );
}
