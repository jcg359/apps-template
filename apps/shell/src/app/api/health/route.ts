import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const buildInfo = {
  service: 'shell',
  version: process.env.npm_package_version ?? '0.0.0',
  commit: process.env.GIT_COMMIT_SHA ?? null,
  builtAt: process.env.BUILD_TIMESTAMP ?? null,
};

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      ...buildInfo,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
