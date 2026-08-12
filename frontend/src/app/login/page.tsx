'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { Button, Field, Input } from '@/components/ui';

interface LoginResponse {
  token: string;
  expiresAt: string;
  user: { id: number; email: string; fullName: string; role: 'Admin' | 'Manager' | 'Staff' };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@inventra.local');
  const [password, setPassword] = useState('Admin!23');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      saveSession(res.token, res.user);
      router.replace('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? (err.detail || err.message) : 'Something went wrong';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      <div className="hidden md:flex flex-col justify-between p-10 border-r hairline">
        <div className="text-[15px] font-semibold tracking-tight">Inventra</div>
        <div className="max-w-md">
          <div className="eyebrow mb-3">Small business, serious tooling</div>
          <p className="text-[22px] leading-snug tracking-tight text-ink">
            Track inventory, ship orders and issue invoices — without the enterprise weight.
          </p>
        </div>
        <div className="text-[12px] text-ink-muted">
          Seed accounts · admin@inventra.local · manager@inventra.local · staff@inventra.local
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <h1 className="text-[20px] font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-[13px] text-ink-muted">Use your Inventra account.</p>

          <div className="mt-6 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
          </div>

          {error && (
            <div className="mt-4 text-[13px] text-danger border border-[#f5c2c2] bg-[#fdecec] rounded px-2.5 py-1.5">
              {error}
            </div>
          )}

          <Button variant="primary" className="mt-6 w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
