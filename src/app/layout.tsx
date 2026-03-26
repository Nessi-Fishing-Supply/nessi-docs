import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import { DocsProvider } from '@/providers/docs-provider';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar } from '@/components/layout/sidebar';
import { DetailPanel } from '@/components/layout/detail-panel';
import { SearchTrigger } from '@/features/search/search-trigger';
import { DeviceGate } from '@/components/layout/device-gate';
import { getAllJourneys } from '@/data';
import { lifecycles } from '@/data/lifecycles';
import '@/styles/globals.scss';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
  weight: '400',
});

export const metadata: Metadata = {
  title: { template: '%s | Nessi Docs', default: 'Nessi Docs' },
  description: 'Documentation and testing tool for the Nessi fishing marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const journeys = getAllJourneys();

  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className={dmSans.className}>
        <DocsProvider>
          <DeviceGate />
          <AppShell
            topbar={<Topbar />}
            sidebar={<Sidebar journeys={journeys} lifecycles={lifecycles} />}
            detail={<DetailPanel />}
          >
            {children}
          </AppShell>
          <SearchTrigger />
        </DocsProvider>
      </body>
    </html>
  );
}
