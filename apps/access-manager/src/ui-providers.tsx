import { useEffect, useState, type ReactNode } from 'react';
import { UIProvider, type LinkComponentProps } from '@repo/ui';

function AppLink({ href, children, ...rest }: LinkComponentProps) {
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

export function AppUIProvider({ children }: { children: ReactNode }) {
  return (
    <UIProvider Link={AppLink} usePathname={useWindowPathname}>
      {children}
    </UIProvider>
  );
}
