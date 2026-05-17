import { useEffect, useState, type ReactNode } from 'react';
import { UIProvider, type LinkComponentProps } from '@repo/ui';

function ShellLink({ href, children, ...rest }: LinkComponentProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

function useWindowPathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return pathname;
}

export function ShellUIProvider({ children }: { children: ReactNode }) {
  return (
    <UIProvider Link={ShellLink} usePathname={useWindowPathname}>
      {children}
    </UIProvider>
  );
}
