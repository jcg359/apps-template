import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-primary-600">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold text-neutral-900">
        Page not found
      </h1>
      <p className="mt-3 text-neutral-600">
        The page you requested doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
      >
        Back to home
      </Link>
    </section>
  );
}
