import React from 'react';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
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

export const metadata = {
  title: {
    default: 'Nessi Docs',
    template: '%s | Nessi Docs',
  },
  description: 'User journeys, flows, and documentation for Nessi fishing marketplace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSans.className} ${dmSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
