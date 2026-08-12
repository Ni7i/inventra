'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Button, Field, Input, PageHeader, Select, Textarea } from '@/components/ui';

interface Category { id: number; name: string; }

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('0.00');
  const [stockOnHand, setStockOnHand] = useState('0');
  const [reorderLevel, setReorderLevel] = useState('0');
  const [categoryId, setCategoryId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { api<Category[]>('/api/categories').then(setCategories).catch(() => {}); }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          sku, name, description: description || null,
          unitPrice: parseFloat(unitPrice),
          stockOnHand: parseInt(stockOnHand, 10),
          reorderLevel: parseInt(reorderLevel, 10),
          categoryId: categoryId ? parseInt(categoryId, 10) : null
        })
      });
      router.push('/products');
    } catch (e) {
      setError(e instanceof ApiError ? e.detail || e.message : String(e));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New product"
        subtitle="Create a product to track stock and sell."
        actions={<Link href="/products"><Button variant="ghost" size="sm">Cancel</Button></Link>}
      />
      <form onSubmit={onSubmit} className="surface p-5 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU" hint="Unique identifier">
            <Input value={sku} onChange={e => setSku(e.target.value)} required />
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Name">
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </Field>
        <Field label="Description" hint="Optional">
          <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Unit price">
            <Input type="number" step="0.01" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required />
          </Field>
          <Field label="Stock on hand">
            <Input type="number" step="1" min="0" value={stockOnHand} onChange={e => setStockOnHand(e.target.value)} required />
          </Field>
          <Field label="Reorder level">
            <Input type="number" step="1" min="0" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} required />
          </Field>
        </div>

        {error && <div className="text-[13px] text-danger">{error}</div>}

        <div className="flex items-center gap-2 pt-2 border-t hairline">
          <Button variant="primary" disabled={submitting}>{submitting ? 'Saving…' : 'Create product'}</Button>
        </div>
      </form>
    </>
  );
}
