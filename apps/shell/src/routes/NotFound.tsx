export function NotFound() {
  return (
    <main className="mx-auto max-w-md p-10 text-center text-sm text-neutral-600">
      <h1 className="mb-2 text-lg font-semibold text-neutral-900">Not found</h1>
      <p className="text-neutral-500">No page at this path.</p>
      <a
        href="/"
        className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Back to home
      </a>
    </main>
  );
}
