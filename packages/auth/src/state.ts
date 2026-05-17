const RETURN_TO_KEY = '@repo/auth:returnTo';

export function stashReturnTo(url: string): void {
  sessionStorage.setItem(RETURN_TO_KEY, url);
}

export function popReturnTo(): string | null {
  const v = sessionStorage.getItem(RETURN_TO_KEY);
  if (v) sessionStorage.removeItem(RETURN_TO_KEY);
  return v;
}
