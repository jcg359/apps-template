export class NotAuthenticatedError extends Error {
  readonly code = 'NOT_AUTHENTICATED';
  readonly status = 401;

  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'NotAuthenticatedError';
  }
}

export class NotAuthorizedError extends Error {
  readonly code = 'NOT_AUTHORIZED';
  readonly status = 403;

  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'NotAuthorizedError';
  }
}
