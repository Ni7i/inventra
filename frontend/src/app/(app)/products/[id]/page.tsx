'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { getUser, hasRole } from '@/lib/auth';
import { Button, Field, Input, PageHeader, Select, Textarea, Badge } from '@/components/ui';
import { formatMoney } from '@/lib/format';

interface Product {
  id: number; sku: string; name: string; description?: string;
  unitPrice: number; stockOnHand: number; reorderLevel: number;
  isActive: boolean; categoryId?: number; categoryName?: string;
}
interface Category { id: number; name: string; }

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const productId = parseInt(id, 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [adjust, setAdjust] = useState('');

  const user = getUser();
  const canEdit = hasRole(user, ['Admin', 'Manager']);

  useEffect(() => {
    api<Product>(`/api/products/${productId}`).then(setProduct).catch(e => setError(String(e)));
    api<Category[]>('/api/categories').then(setCategories).catch(() => {});
  }, [productId]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api<Product>(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: product.name,
          description: product.description ?? null,
          unitPrice: product.unitPrice,
          reorderLevel: product.reorderLevel,
          categoryId: product.categoryId ?? null,
          isActive: product.isActive
        })
      });
      setProduct(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail || e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function onAdjust() {
    if (!adjust || !product) return;
    setError(null);
    try {
      const updated = await api<Product>(`/api/products/${productId}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify({ delta: parseInt(adjust, 10), reason: null })
      });
      setProduct(updated);
      setAdjust('');
    } catch (e) {
      setError(e instanceof ApiError ? e.detail || e.message : String(e));
    }
  }

  async function onDelete() {
    if (!confirm('Delete this product? If it has orders it will be deactivated instead.')) return;
    try {
      await api(`/api/products/${productId}`, { method: 'DELETE' });
      router.push('/products');
    } catch (e) {
      setError(e instanceof ApiError ? e.detail || e.message : String(e));
    }
  }

  if (!product) return <div className="text-[13px] text-ink-muted">Loading…</div>;

  const low = product.stockOnHand <= product.reorderLevel;

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={<span className="font-mono">{product.sku}</span> as unknown as string}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/products"><Button variant="ghost" size="sm">Back</Button></Link>
            {canEdit && <Button size="sm" variant="danger" onClick={onDelete}>Delete</Button>}
          </div>
        }
      />

      {error && <div className="text-[13px] text-danger mb-3">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <div className="surface p-4">
          <div className="eyebrow">Stock on hand</div>
          <div className="mt-2 num text-[22px] font-semibold">{product.stockOnHand}</div>
          <div className="mt-1">{low ? <Badge tone="warn">Below reorder ({product.reorderLevel})</Badge> : <Badge tone="ok">OK</Badge>}</div>
        </div>
        <div className="surface p-4">
          <div className="eyebrow">Unit price</div>
          <div className="mt-2 num text-[22px] font-semibold">{formatMoney(product.unitPrice)}</div>
        </div>
        <div className="surface p-4">
          <div className="eyebrow">Category</div>
          <div className="mt-2 text-[15px]">{product.categoryName ?? '—'}</div>
        </div>
      </div>

      {canEdit && (
        <div className="surface p-4 mb-6 flex items-end gap-3">
          <div className="w-40">
            <Field label="Adjust stock" hint="+/- units">
              <Input type="number" step="1" value={adjust} onChange={e => setAdjust(e.target.value)} placeholder="e.g. 20 or -5" />
            </Field>
          </div>
          <Button onClick={onAdjust} disabled={!adjust}>Apply</Button>
        </div>
      )}

      <form onSubmit={onSave} className="surface p-5 max-w-2xl space-y-4">
        <Field label="Name">
          <Input value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })} required disabled={!canEdit} />
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={product.description ?? ''} onChange={e => setProduct({ ...product, description: e.target.value })} disabled={!canEdit} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Unit price">
            <Input type="number" step="0.01" min="0" value={product.unitPrice}
              onChange={e => setProduct({ ...product, unitPrice: parseFloat(e.target.value) })} disabled={!canEdit} />
          </Field>
          <Field label="Reorder level">
            <Input type="number" step="1" min="0" value={product.reorderLevel}
              onChange={e => setProduct({ ...product, reorderLevel: parseInt(e.target.value, 10) })} disabled={!canEdit} />
          </Field>
          <Field label="Category">
            <Select value={product.categoryId ?? ''} onChange={e => setProduct({ ...product, categoryId: e.target.value ? parseInt(e.target.value, 10) : undefined })} disabled={!canEdit}>
              <option value="">Uncategorized</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
        <label className="inline-flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={product.isActive}
            onChange={e => setProduct({ ...product, isActive: e.target.checked })} disabled={!canEdit} />
          Active
        </label>
        {canEdit && (
          <div className="pt-2 border-t hairline">
            <Button variant="primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save changes'}</Button>
          </div>
        )}
      </form>
    </>
  );
}
