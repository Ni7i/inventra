'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { getUser, hasRole } from '@/lib/auth';
import { Button, EmptyState, Field, Input, PageHeader } from '@/components/ui';

interface Category { id: number; name: string; description?: string; productCount: number; }

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const user = getUser();
  const canEdit = hasRole(user, ['Admin', 'Manager']);
  const canDelete = hasRole(user, ['Admin']);

  const load = () => api<Category[]>('/api/categories').then(setRows).catch(e => setError(String(e)));
  useEffect(() => { void load(); }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/api/categories', { method: 'POST', body: JSON.stringify({ name, description: description || null }) });
      setName(''); setDescription('');
      await load();
    } catch (e) { setError(e instanceof ApiError ? e.detail || e.message : String(e)); }
  }

  async function onDelete(id: number) {
    if (!confirm('Delete this category?')) return;
    try { await api(`/api/categories/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.detail || e.message : String(e)); }
  }

  return (
    <>
      <PageHeader title="Categories" subtitle={`${rows.length} defined`} />

      {canEdit && (
        <form onSubmit={onCreate} className="surface p-4 mb-4 grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <Field label="Name"><Input value={name} onChange={e => setName(e.target.value)} required /></Field>
          <Field label="Description"><Input value={description} onChange={e => setDescription(e.target.value)} /></Field>
          <Button variant="primary">Add category</Button>
        </form>
      )}

      {error && <div className="text-[13px] text-danger mb-3">{error}</div>}

      {rows.length === 0 ? (
        <EmptyState title="No categories" hint="Start by adding one above." />
      ) : (
        <div className="surface overflow-x-auto scroll-thin">
          <table className="w-full text-[13px]">
            <thead className="text-ink-muted">
              <tr className="border-b hairline">
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Name</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Description</th>
                <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Products</th>
                <th className="w-1"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} className="border-b hairline last:border-0">
                  <td className="px-3 py-2.5 font-medium">{c.name}</td>
                  <td className="px-3 py-2.5 text-ink-muted">{c.description ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right num">{c.productCount}</td>
                  <td className="px-3 py-2.5 text-right">
                    {canDelete && <Button size="sm" variant="ghost" onClick={() => onDelete(c.id)}>Remove</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
