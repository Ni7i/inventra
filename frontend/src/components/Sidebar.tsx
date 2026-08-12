'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/format';
import { CurrentUser, hasRole } from '@/lib/auth';

type Item = { href: string; label: string; roles?: ('Admin' | 'Manager' | 'Staff')[] };

const groups: { heading: string; items: Item[] }[] = [
  {
    heading: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard' }]
  },
  {
    heading: 'Catalog',
    items: [
      { href: '/products', label: 'Products' },
      { href: '/categories', label: 'Categories' }
    ]
  },
  {
    heading: 'Sales',
    items: [
      { href: '/customers', label: 'Customers' },
      { href: '/orders', label: 'Orders' },
      { href: '/invoices', label: 'Invoices' }
    ]
  },
  {
    heading: 'Admin',
    items: [{ href: '/users', label: 'Users', roles: ['Admin'] }]
  }
];

export function Sidebar({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col w-56 shrink-0 border-r hairline bg-paper">
      <div className="h-14 flex items-center px-4 border-b hairline">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-sm bg-ink flex items-center justify-center text-paper text-[11px] font-semibold">I</span>
          <span className="text-[15px] font-semibold tracking-tight">Inventra</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin py-4">
        {groups.map(group => {
          const visible = group.items.filter(i => !i.roles || hasRole(user, i.roles));
          if (visible.length === 0) return null;
          return (
            <div key={group.heading} className="mb-4">
              <div className="px-4 mb-1 eyebrow">{group.heading}</div>
              <ul>
                {visible.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center h-8 px-4 text-[13.5px]',
                          active
                            ? 'text-ink font-medium bg-paper-hover border-l-2 border-accent -ml-[1px]'
                            : 'text-ink-muted hover:text-ink hover:bg-paper-hover'
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t hairline">
        <div className="text-[13px] font-medium truncate">{user?.fullName ?? '—'}</div>
        <div className="text-[11px] uppercase tracking-wide text-ink-muted">{user?.role ?? ''}</div>
      </div>
    </nav>
  );
}
