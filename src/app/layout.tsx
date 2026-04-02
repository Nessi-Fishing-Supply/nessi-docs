import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { StalenessBanner } from '@/components/layout/staleness-banner';
import { DeviceGate } from '@/components/layout/device-gate';
import { ToastProvider } from '@/components/ui/toast';
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
    <html lang="en" data-theme="dark" className={dmSans.variable}>
      <body className={dmSans.className}>
        <StalenessBanner />
        <DeviceGate />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
