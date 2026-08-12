'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { getUser, hasRole } from '@/lib/auth';
import { Badge, Button, Field, Input, PageHeader, Select } from '@/components/ui';

export default function UsersPage() {
  const router = useRouter();
  const user = getUser();
  const isAdmin = hasRole(user, ['Admin']);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (user && !isAdmin) router.replace('/dashboard'); }, [user, isAdmin, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null); setError(null);
    try {
      const u = await api<{ id: number; email: string; fullName: string; role: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, role })
      });
      setMessage(`Created ${u.email} (${u.role}). Share the password securely.`);
      setEmail(''); setFullName(''); setPassword(''); setRole('Staff');
    } catch (e) { setError(e instanceof ApiError ? e.detail || e.message : String(e)); }
  }

  if (!isAdmin) return null;

  return (
    <>
      <PageHeader title="Users" subtitle="Create user accounts and assign a role." />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <form onSubmit={onSubmit} className="surface p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name"><Input required value={fullName} onChange={e => setFullName(e.target.value)} /></Field>
            <Field label="Email"><Input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
            <Field label="Password" hint="Min 8 characters">
              <Input required minLength={8} type="text" value={password} onChange={e => setPassword(e.target.value)} />
            </Field>
            <Field label="Role">
              <Select value={role} onChange={e => setRole(e.target.value)}>
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </Select>
            </Field>
          </div>
          {message && <div className="text-[13px] text-accent border border-accent/30 bg-accent-soft rounded px-2.5 py-1.5">{message}</div>}
          {error && <div className="text-[13px] text-danger border border-[#f5c2c2] bg-[#fdecec] rounded px-2.5 py-1.5">{error}</div>}
          <div className="pt-2 border-t hairline"><Button variant="primary">Create user</Button></div>
        </form>

        <aside className="surface p-4 h-fit">
          <div className="eyebrow mb-2">Role reference</div>
          <ul className="space-y-2 text-[13px]">
            <li><Badge tone="accent">Admin</Badge> <span className="text-ink-muted">Full access, user management, delete.</span></li>
            <li><Badge tone="neutral">Manager</Badge> <span className="text-ink-muted">Create/edit products, customers, orders, invoices.</span></li>
            <li><Badge tone="neutral">Staff</Badge> <span className="text-ink-muted">Read + create draft orders.</span></li>
          </ul>
        </aside>
      </div>
    </>
  );
}
