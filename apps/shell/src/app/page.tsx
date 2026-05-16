import { AppCardGrid } from '@repo/ui';
import { apps } from '@/config/apps';

export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          App selector
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Choose an app
        </h1>
        <p className="max-w-2xl text-sm text-neutral-500">
          Open one of the apps below, or use the{' '}
          <span className="font-medium text-neutral-700">+</span> button in the
          header to switch from anywhere.
        </p>
      </div>

      <AppCardGrid apps={apps} />
    </section>
  );
}
