import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/components/AppContext';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Lumio — Aprende todos os dias',
  description: 'Um espaço pessoal para aprender línguas e programação com lições, vocabulário, conversação e revisão espaçada.',
};

export const viewport: Viewport = {
  themeColor: '#F7F5EF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
