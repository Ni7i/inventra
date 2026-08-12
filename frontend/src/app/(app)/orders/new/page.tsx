'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Button, Field, Input, PageHeader, Select } from '@/components/ui';
import { formatMoney } from '@/lib/format';

interface Customer { id: number; companyName: string; }
interface Product { id: number; sku: string; name: string; unitPrice: number; stockOnHand: number; }
interface LineDraft { productId: number; quantity: number; }

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [taxRate, setTaxRate] = useState('0.081');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<Customer[]>('/api/customers').then(setCustomers).catch(() => {});
    api<Product[]>('/api/products').then(setProducts).catch(() => {});
  }, []);

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const subtotal = lines.reduce((s, l) => {
    const p = productMap.get(l.productId);
    return s + (p ? p.unitPrice * l.quantity : 0);
  }, 0);
  const tax = Math.round(subtotal * (parseFloat(taxRate) || 0) * 100) / 100;
  const total = subtotal + tax;

  const addLine = () => setLines([...lines, { productId: products[0]?.id ?? 0, quantity: 1 }]);
  const setLine = (idx: number, patch: Partial<LineDraft>) =>
    setLines(lines.map((l, i) => i === idx ? { ...l, ...patch } : l));
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!customerId || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api<{ id: number }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: parseInt(customerId, 10),
          taxRate: parseFloat(taxRate),
          lines: lines.map(l => ({ productId: l.productId, quantity: l.quantity }))
        })
      });
      router.push(`/orders/${res.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail || e.message : String(e));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New order"
        actions={<Link href="/orders"><Button variant="ghost" size="sm">Cancel</Button></Link>}
      />
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="surface p-4">
            <Field label="Customer">
              <Select required value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Choose a customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </Select>
            </Field>
          </div>

          <div className="surface">
            <div className="p-4 border-b hairline flex items-center justify-between">
              <div className="font-medium">Line items</div>
              <Button type="button" size="sm" onClick={addLine} disabled={products.length === 0}>Add line</Button>
            </div>
            {lines.length === 0 ? (
              <div className="p-6 text-[13px] text-ink-muted">No lines yet. Add at least one product.</div>
            ) : (
              <table className="w-full text-[13px]">
                <thead className="text-ink-muted">
                  <tr className="border-b hairline">
                    <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Product</th>
                    <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2 w-24">Unit</th>
                    <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2 w-24">Qty</th>
                    <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2 w-28">Line total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => {
                    const p = productMap.get(l.productId);
                    return (
                      <tr key={i} className="border-b hairline last:border-0">
                        <td className="px-3 py-2">
                          <Select value={l.productId} onChange={e => setLine(i, { productId: parseInt(e.target.value, 10) })}>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.sku} · {p.name} (stock: {p.stockOnHand})</option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-right num text-ink-muted">{formatMoney(p?.unitPrice ?? 0)}</td>
                        <td className="px-3 py-2 text-right">
                          <Input type="number" min={1} step={1} className="w-20 text-right"
                            value={l.quantity} onChange={e => setLine(i, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })} />
                        </td>
                        <td className="px-3 py-2 text-right num font-medium">
                          {formatMoney((p?.unitPrice ?? 0) * l.quantity)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={() => removeLine(i)} className="text-ink-muted hover:text-danger text-lg leading-none">×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-4 space-y-3">
            <Field label="Tax rate" hint="e.g. 0.081 for 8.1% VAT">
              <Input value={taxRate} onChange={e => setTaxRate(e.target.value)} />
            </Field>
            <div className="pt-3 border-t hairline space-y-1.5 text-[13px]">
              <Row label="Subtotal" value={formatMoney(subtotal)} />
              <Row label="Tax" value={formatMoney(tax)} muted />
              <Row label="Total" value={formatMoney(total)} strong />
            </div>
          </div>
          {error && <div className="text-[13px] text-danger">{error}</div>}
          <Button variant="primary" className="w-full" disabled={submitting || lines.length === 0 || !customerId}>
            {submitting ? 'Creating…' : 'Create draft order'}
          </Button>
          <p className="text-[12px] text-ink-muted">Order will be created as a draft. Confirm it to reduce stock.</p>
        </div>
      </form>
    </>
  );
}

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={muted ? 'text-ink-muted' : ''}>{label}</span>
      <span className={`num ${strong ? 'font-semibold text-[15px]' : ''}`}>{value}</span>
    </div>
  );
}
