import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { DocsProvider } from '@/providers/docs-provider';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar } from '@/components/layout/sidebar';
import { DetailPanel } from '@/components/layout/detail-panel';
import { SearchTrigger } from '@/features/search/search-trigger';
import { DeviceGate } from '@/components/layout/device-gate';
import { StalenessBanner } from '@/components/layout/staleness-banner';
import { lifecycles, getFeatureDomains } from '@/data';
import '@/styles/globals.scss';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: { template: '%s | Nessi Docs', default: 'Nessi Docs' },
  description: 'Documentation and testing tool for the Nessi fishing marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={dmSans.className}>
        <StalenessBanner />
        <DocsProvider>
          <DeviceGate />
          <AppShell
            topbar={<Topbar />}
            sidebar={
              <Sidebar
                lifecycles={lifecycles}
                featureDomains={getFeatureDomains().map((d) => ({ slug: d.slug, label: d.label }))}
              />
            }
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
