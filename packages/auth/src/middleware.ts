import { NotAuthenticatedError } from './errors';
import type { Session } from './session';

export interface AuthedRequestContext {
  session: Session;
}

export type RouteHandler<TArgs extends unknown[] = unknown[]> = (
  request: Request,
  ...rest: TArgs
) => Response | Promise<Response>;

export type AuthedRouteHandler<TArgs extends unknown[] = unknown[]> = (
  request: Request,
  context: AuthedRequestContext,
  ...rest: TArgs
) => Response | Promise<Response>;

/**
 * Placeholder higher-order function that wraps a Next.js API route handler and
 * supplies a validated session. The real implementation will pull the session
 * from cookies/headers and call validateSession from "./session".
 */
export function withAuth<TArgs extends unknown[]>(
  handler: AuthedRouteHandler<TArgs>,
): RouteHandler<TArgs> {
  return async (request, ...rest) => {
    // Stubbed: real implementation will read the session cookie / Authorization
    // header, call validateSession, and attach the result to the context.
    throw new NotAuthenticatedError('withAuth not implemented');
    // The line below is unreachable today but documents the intended shape.
    // return handler(request, { session }, ...rest);
  };
}
