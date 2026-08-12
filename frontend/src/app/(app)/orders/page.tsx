'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Badge, Button, EmptyState, PageHeader, Select } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';

type Status = 'Draft' | 'Confirmed' | 'Shipped' | 'Cancelled';
interface Order {
  id: number; orderNumber: string; customerName: string;
  status: number; total: number; createdAt: string;
}

const STATUSES: Status[] = ['Draft', 'Confirmed', 'Shipped', 'Cancelled'];

function statusLabel(n: number): Status { return STATUSES[n] ?? 'Draft'; }

function statusTone(s: Status) {
  return s === 'Confirmed' ? 'accent'
    : s === 'Shipped' ? 'ok'
    : s === 'Cancelled' ? 'danger' : 'neutral';
}

export default function OrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    try { setRows(await api<Order[]>(`/api/orders?${params}`)); }
    catch (e) { setError(String(e)); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${rows.length} shown`}
        actions={<Link href="/orders/new"><Button variant="primary" size="sm">New order</Button></Link>}
      />

      <div className="mb-4 w-48">
        <Select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s, i) => <option key={s} value={i}>{s}</option>)}
        </Select>
      </div>

      {error && <div className="text-[13px] text-danger mb-3">{error}</div>}

      {rows.length === 0 ? (
        <EmptyState title="No orders" hint="Create your first order to see it here." />
      ) : (
        <div className="surface overflow-x-auto scroll-thin">
          <table className="w-full text-[13px]">
            <thead className="text-ink-muted">
              <tr className="border-b hairline">
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Number</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Customer</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Created</th>
                <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Total</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(o => {
                const s = statusLabel(o.status);
                return (
                  <tr key={o.id} className="border-b hairline last:border-0 hover:bg-paper-hover">
                    <td className="px-3 py-2.5 font-mono text-[12px]">
                      <Link href={`/orders/${o.id}`} className="hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-3 py-2.5">{o.customerName}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{formatDate(o.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right num font-medium">{formatMoney(o.total)}</td>
                    <td className="px-3 py-2.5"><Badge tone={statusTone(s)}>{s}</Badge></td>
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
