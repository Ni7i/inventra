'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { getUser, hasRole } from '@/lib/auth';
import { Badge, Button, EmptyState, PageHeader, Select } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';

const STATUSES = ['Issued', 'Paid', 'Overdue', 'Cancelled'] as const;
type Status = typeof STATUSES[number];

interface Invoice {
  id: number; invoiceNumber: string; orderId: number; orderNumber: string;
  customerName: string; status: number;
  subtotal: number; taxAmount: number; total: number;
  issuedAt: string; dueAt: string; paidAt?: string;
}

function tone(s: Status) {
  return s === 'Paid' ? 'ok' : s === 'Overdue' ? 'warn' : s === 'Cancelled' ? 'danger' : 'accent';
}

export default function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const user = getUser();
  const canAct = hasRole(user, ['Admin', 'Manager']);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    try { setRows(await api<Invoice[]>(`/api/invoices?${params}`)); }
    catch (e) { setError(String(e)); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  async function mark(id: number, action: 'mark-paid' | 'mark-overdue') {
    try {
      await api(`/api/invoices/${id}/${action}`, { method: 'POST' });
      await load();
    } catch (e) { setError(e instanceof ApiError ? e.detail || e.message : String(e)); }
  }

  return (
    <>
      <PageHeader title="Invoices" subtitle={`${rows.length} shown`} />

      <div className="mb-4 w-48">
        <Select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s, i) => <option key={s} value={i}>{s}</option>)}
        </Select>
      </div>

      {error && <div className="text-[13px] text-danger mb-3">{error}</div>}

      {rows.length === 0 ? (
        <EmptyState title="No invoices" hint="Issue an invoice from a confirmed order." />
      ) : (
        <div className="surface overflow-x-auto scroll-thin">
          <table className="w-full text-[13px]">
            <thead className="text-ink-muted">
              <tr className="border-b hairline">
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Number</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Customer</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Issued</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Due</th>
                <th className="text-right font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Total</th>
                <th className="text-left font-medium text-[11.5px] uppercase tracking-wider px-3 py-2">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(i => {
                const s = STATUSES[i.status];
                return (
                  <tr key={i.id} className="border-b hairline last:border-0 hover:bg-paper-hover">
                    <td className="px-3 py-2.5 font-mono text-[12px]">{i.invoiceNumber}</td>
                    <td className="px-3 py-2.5">{i.customerName}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{formatDate(i.issuedAt)}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{formatDate(i.dueAt)}</td>
                    <td className="px-3 py-2.5 text-right num font-medium">{formatMoney(i.total)}</td>
                    <td className="px-3 py-2.5"><Badge tone={tone(s)}>{s}</Badge></td>
                    <td className="px-3 py-2.5 text-right">
                      {canAct && s === 'Issued' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => mark(i.id, 'mark-overdue')}>Overdue</Button>
                          <Button size="sm" variant="primary" onClick={() => mark(i.id, 'mark-paid')}>Mark paid</Button>
                        </div>
                      )}
                      {canAct && s === 'Overdue' && (
                        <Button size="sm" variant="primary" onClick={() => mark(i.id, 'mark-paid')}>Mark paid</Button>
                      )}
                    </td>
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
