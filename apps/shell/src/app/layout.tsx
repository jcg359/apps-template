import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppLauncherButton, Header } from '@repo/ui';
import { apps } from '@/config/apps';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apps Platform',
  description: 'Composition shell for the apps-template microfrontend platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header title="Apps Platform" right={<AppLauncherButton apps={apps} />} />
        <main className="mx-auto max-w-screen-2xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
