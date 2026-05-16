import Link from 'next/link';

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  href: string;
}

export interface AppCardProps {
  app: AppDefinition;
}

function initial(name: string): string {
  const ch = name.trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link
      href={app.href}
      className="group block rounded-xl border border-neutral-200 bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-base font-semibold text-neutral-700 transition-colors group-hover:bg-neutral-900 group-hover:text-white">
        {initial(app.name)}
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-900">{app.name}</h3>
      <p className="mt-1 text-sm text-neutral-500">{app.description}</p>
    </Link>
  );
}
