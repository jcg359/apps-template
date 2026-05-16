'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavProps {
  links: NavLink[];
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ links }: NavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex items-center gap-2">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={[
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
            ].join(' ')}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
