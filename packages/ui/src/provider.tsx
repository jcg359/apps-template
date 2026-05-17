import {
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from 'react';

export interface LinkComponentProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
}

export interface UIContextValue {
  Link: ComponentType<LinkComponentProps>;
  usePathname: () => string;
}

const UIContext = createContext<UIContextValue | null>(null);

export interface UIProviderProps extends UIContextValue {
  children: ReactNode;
}

export function UIProvider({ children, Link, usePathname }: UIProviderProps) {
  return <UIContext.Provider value={{ Link, usePathname }}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used within a <UIProvider>');
  }
  return ctx;
}
