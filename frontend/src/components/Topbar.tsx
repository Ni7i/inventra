'use client';

import { useRouter } from 'next/navigation';
import { CurrentUser, clearToken } from '@/lib/auth';
import { Button } from './ui';

export function Topbar({ user, title }: { user: CurrentUser | null; title?: string }) {
  const router = useRouter();

  const signOut = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <header className="h-14 border-b hairline flex items-center justify-between px-6 bg-paper">
      <div className="text-[13px] text-ink-muted">{title ?? ''}</div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-[13px] font-medium leading-tight">{user?.fullName ?? '—'}</div>
          <div className="text-[11px] text-ink-muted uppercase tracking-wide">{user?.email ?? ''}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center text-[12px] font-semibold">
          {(user?.fullName ?? '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
      </div>
    </header>
  );
}
