'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, CurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    setUser(u);
    setReady(true);
  }, [router]);

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
