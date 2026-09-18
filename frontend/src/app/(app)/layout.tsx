'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUserRaw, parseUser } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // null while rendering on the server / hydrating, '' when there is no session.
  const rawUser = useSyncExternalStore<string | null>(subscribeToStorage, getStoredUserRaw, () => null);
  const user = useMemo(() => parseUser(rawUser), [rawUser]);
  const ready = user !== null;

  useEffect(() => {
    if (rawUser !== null && !user) router.replace('/login');
  }, [rawUser, user, router]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-[13px] text-ink-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto scroll-thin">
          <div className="max-w-[1200px] mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
