'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { getUser, hasRole } from '@/lib/auth';
import { Badge, Button, PageHeader } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';

interface Line { id: number; productId: number; productSku: string; productName: string; unitPrice: number; quantity: number; lineTotal: number; }
interface Order {
  id: number; orderNumber: string; customerId: number; customerName: string;
  status: number; subtotal: number; taxAmount: number; total: number;
  createdAt: string; confirmedAt?: string; shippedAt?: string;
  lines: Line[]; invoiceId?: number; invoiceNumber?: string;
}

const STATUSES = ['Draft', 'Confirmed', 'Shipped', 'Cancelled'] as const;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = parseInt(id, 10);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const user = getUser();
  const canAct = hasRole(user, ['Admin', 'Manager']);

  const load = () => api<Order>(`/api/orders/${orderId}`).then(setOrder).catch(e => setError(String(e)));
  useEffect(() => { void load(); }, [orderId]);

  async function run(action: 'confirm' | 'ship' | 'cancel') {
    setWorking(true); setError(null);
    try {
      const res = await api<Order>(`/api/orders/${orderId}/${action}`, { method: 'POST' });
      setOrder(res);
    } catch (e) { setError(e instanceof ApiError ? e.detail || e.message : String(e)); }
    finally { setWorking(false); }
  }

  async function invoice() {
    setWorking(true); setError(null);
    try {
      const inv = await api<{ id: number }>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({ orderId, dueInDays: 30 })
      });
      router.push(`/invoices?highlight=${inv.id}`);
    } catch (e) { setError(e instanceof ApiError ? e.detail || e.message : String(e)); }
    finally { setWorking(false); }
  }

  if (!order) return <div className="text-[13px] text-ink-muted">Loading…</div>;

  const status = STATUSES[order.status];
  const tone = status === 'Confirmed' ? 'accent' : status === 'Shipped' ? 'ok' : status === 'Cancelled' ? 'danger' : 'neutral';

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        subtitle={`For ${order.customerName} · created ${formatDate(order.createdAt, true)}`}
        actions={<Link href="/orders"><Button variant="ghost" size="sm">Back</Button></Link>}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge tone={tone}>{status}</Badge>
        {order.invoiceNumber && <Badge tone="accent">Invoice {order.invoiceNumber}</Badge>}
        {order.confirmedAt && <span className="text-[12px] text-ink-muted">Confirmed {formatDate(order.confirmedAt, true)}</span>}
        {order.shippedAt && <span className="text-[12px] text-ink-muted">Shipped {formatDate(order.shippedAt, true)}</span>}
      </div>

      {error && <div className="text-[13px] text-danger mb-3">{error}</div>}

      {canAct && (
        <div className="flex flex-wrap gap-2 mb-4">
          {status === 'Draft' && <Button onClick={() => run('confirm')} disabled={working}>Confirm & reduce stock</Button>}
          {status === 'Confirmed' && <Button onClick={() => run('ship')} disabled={working}>Mark shipped</Button>}
          {(status === 'Draft' || status === 'Confirmed') && <Button variant="danger" onClick={() => run('cancel')} disabled={working}>Cancel</Button>}
          {(status === 'Confirmed' || status === 'Shipped') && !order.invoiceNumber &&
            <Button variant="primary" onClick={invoice} disabled={working}>Issue invoice</Button>}
        </div>
      )}

      <div className="surface overflow-x-auto scroll-thin">
        <table className="w-full text-[13px]">
          <thead className="text-ink-muted">
            <tr className="border-b hairline">
              <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">SKU</th>
              <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Product</th>
              <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Unit</th>
              <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Qty</th>
              <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map(l => (
              <tr key={l.id} className="border-b hairline last:border-0">
                <td className="px-3 py-2.5 font-mono text-[12px]">{l.productSku}</td>
                <td className="px-3 py-2.5">{l.productName}</td>
                <td className="px-3 py-2.5 text-right num text-ink-muted">{formatMoney(l.unitPrice)}</td>
                <td className="px-3 py-2.5 text-right num">{l.quantity}</td>
                <td className="px-3 py-2.5 text-right num font-medium">{formatMoney(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3}></td><td className="px-3 py-2 text-right text-ink-muted">Subtotal</td><td className="px-3 py-2 text-right num">{formatMoney(order.subtotal)}</td></tr>
            <tr><td colSpan={3}></td><td className="px-3 py-2 text-right text-ink-muted">Tax</td><td className="px-3 py-2 text-right num">{formatMoney(order.taxAmount)}</td></tr>
            <tr className="border-t hairline"><td colSpan={3}></td><td className="px-3 py-2.5 text-right font-medium">Total</td><td className="px-3 py-2.5 text-right num font-semibold text-[15px]">{formatMoney(order.total)}</td></tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
