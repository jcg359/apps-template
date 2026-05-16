import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Real session logic (refresh, shared session store, tenant assertions) lives
// here. Future state: replace this with withAuth from @repo/auth once the
// placeholder is implemented:
//
//   export const GET = withAuth(async (_req, { session }) => {
//     return NextResponse.json({ user: session.user });
//   });
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.user.id ?? null,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      tenantId: session.user.tenantId,
    },
  });
}
