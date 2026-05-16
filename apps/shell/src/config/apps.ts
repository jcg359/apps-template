import type { AppDefinition } from '@repo/ui';

// Catalog of apps surfaced in the launcher and on the app-selector landing page.
// When a sub-app graduates from placeholder to real route, update its href and
// add the matching rewrite in next.config.ts.
export const apps: AppDefinition[] = [
  {
    id: 'app-selector',
    name: 'App Selector',
    description: 'Browse and launch any app on the platform.',
    href: '/',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'At-a-glance metrics and recent activity across your workspace.',
    href: '/dashboard',
  },
  {
    id: 'access-manager',
    name: 'Access Manager',
    description: 'Manage users, roles, and permissions for the platform.',
    href: '/access',
  },
];
