'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { getUser, hasRole } from '@/lib/auth';
import { Button, Input, PageHeader, Badge, EmptyState, Select } from '@/components/ui';
import { formatMoney } from '@/lib/format';

interface Product {
  id: number; sku: string; name: string; description?: string;
  unitPrice: number; stockOnHand: number; reorderLevel: number;
  isActive: boolean; categoryId?: number; categoryName?: string;
}
interface Category { id: number; name: string; productCount: number; }

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = getUser();
  const canEdit = hasRole(user, ['Admin', 'Manager']);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      const data = await api<Product[]>(`/api/products?${params}`);
      setRows(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail || e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [search, categoryId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { api<Category[]>('/api/categories').then(setCategories).catch(() => {}); }, []);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${rows.length} shown`}
        actions={canEdit && <Link href="/products/new"><Button variant="primary" size="sm">New product</Button></Link>}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[220px] max-w-xs">
          <Input placeholder="Search name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-56">
          <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </div>

      {error && <div className="text-[13px] text-danger mb-3">{error}</div>}

      {loading ? (
        <div className="text-[13px] text-ink-muted">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No products" hint="Adjust the filters or add a new product." />
      ) : (
        <div className="surface overflow-x-auto scroll-thin">
          <table className="w-full text-[13px]">
            <thead className="text-ink-muted">
              <tr className="border-b hairline">
                <Th>SKU</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th className="text-right">Reorder</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const low = p.stockOnHand <= p.reorderLevel;
                return (
                  <tr key={p.id} className="border-b hairline last:border-0 hover:bg-paper-hover">
                    <Td className="font-mono text-[12px]">{p.sku}</Td>
                    <Td>
                      <Link href={`/products/${p.id}`} className="hover:underline">{p.name}</Link>
                    </Td>
                    <Td className="text-ink-muted">{p.categoryName ?? '—'}</Td>
                    <Td className="text-right num">{formatMoney(p.unitPrice)}</Td>
                    <Td className="text-right num">
                      <span className={low ? 'text-warn font-medium' : ''}>{p.stockOnHand}</span>
                    </Td>
                    <Td className="text-right num text-ink-muted">{p.reorderLevel}</Td>
                    <Td>
                      {!p.isActive
                        ? <Badge tone="neutral">Inactive</Badge>
                        : low ? <Badge tone="warn">Low</Badge> : <Badge tone="ok">OK</Badge>}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2 ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}
