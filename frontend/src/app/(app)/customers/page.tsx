'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { getUser, hasRole } from '@/lib/auth';
import { Button, EmptyState, Field, Input, PageHeader, Textarea } from '@/components/ui';

interface Customer {
  id: number; companyName: string; contactName?: string; email?: string; phone?: string;
  addressLine1?: string; city?: string; country?: string; notes?: string; orderCount: number;
}

const empty = {
  companyName: '', contactName: '', email: '', phone: '',
  addressLine1: '', addressLine2: '', postalCode: '', city: '', country: '', notes: ''
};

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = getUser();
  const canEdit = hasRole(user, ['Admin', 'Manager']);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    try { setRows(await api<Customer[]>(`/api/customers?${params}`)); }
    catch (e) { setError(String(e)); }
  }, [search]);

  useEffect(() => { void load(); }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/api/customers', { method: 'POST', body: JSON.stringify(form) });
      setForm(empty); setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof ApiError ? e.detail || e.message : String(e)); }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${rows.length} shown`}
        actions={canEdit && <Button size="sm" variant="primary" onClick={() => setShowForm(v => !v)}>{showForm ? 'Close' : 'New customer'}</Button>}
      />

      <div className="mb-4 max-w-xs">
        <Input placeholder="Search company, contact or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {showForm && canEdit && (
        <form onSubmit={onCreate} className="surface p-5 mb-4 space-y-4 max-w-3xl">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company"><Input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></Field>
            <Field label="Contact person"><Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Address"><Input value={form.addressLine1} onChange={e => setForm({ ...form, addressLine1: e.target.value })} /></Field>
            <Field label="Postal code / City">
              <div className="flex gap-2">
                <Input className="w-24" value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} />
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
            </Field>
            <Field label="Country"><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></Field>
          </div>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="pt-2 border-t hairline"><Button variant="primary">Create customer</Button></div>
        </form>
      )}

      {error && <div className="text-[13px] text-danger mb-3">{error}</div>}

      {rows.length === 0 ? (
        <EmptyState title="No customers" hint="Add your first customer to start selling." />
      ) : (
        <div className="surface overflow-x-auto scroll-thin">
          <table className="w-full text-[13px]">
            <thead className="text-ink-muted">
              <tr className="border-b hairline">
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Company</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Contact</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Email</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">City</th>
                <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Orders</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} className="border-b hairline last:border-0 hover:bg-paper-hover">
                  <td className="px-3 py-2.5 font-medium">{c.companyName}</td>
                  <td className="px-3 py-2.5 text-ink-muted">{c.contactName ?? '—'}</td>
                  <td className="px-3 py-2.5 text-ink-muted">{c.email ?? '—'}</td>
                  <td className="px-3 py-2.5 text-ink-muted">{c.city ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right num">{c.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
