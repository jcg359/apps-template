import { AppCard, type AppDefinition } from './AppCard';

export interface AppCardGridProps {
  apps: AppDefinition[];
  density?: 'comfortable' | 'compact';
}

const densityClasses: Record<NonNullable<AppCardGridProps['density']>, string> = {
  comfortable: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  compact: 'grid gap-3 grid-cols-1 sm:grid-cols-2',
};

export function AppCardGrid({ apps, density = 'comfortable' }: AppCardGridProps) {
  return (
    <div className={densityClasses[density]}>
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
