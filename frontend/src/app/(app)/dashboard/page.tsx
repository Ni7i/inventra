'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHeader, Stat, Badge } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/format';

interface TopProduct { productId: number; name: string; sku: string; unitsSold: number; revenue: number; }
interface RevenuePoint { date: string; revenue: number; orderCount: number; }
interface Dashboard {
  productsTotal: number;
  lowStockCount: number;
  ordersToday: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  openInvoices: number;
  outstandingAmount: number;
  topProducts: TopProduct[];
  revenueByDay: RevenuePoint[];
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Dashboard>('/api/stats/dashboard').then(setData).catch(e => setError(String(e)));
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Snapshot of activity this month." />

      {error && <div className="text-[13px] text-danger">{error}</div>}

      {!data ? (
        <div className="text-[13px] text-ink-muted">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Active products" value={String(data.productsTotal)} />
            <Stat label="Low stock" value={String(data.lowStockCount)} hint="At or below reorder level" />
            <Stat label="Orders (month)" value={String(data.ordersThisMonth)} hint={`${data.ordersToday} today`} />
            <Stat label="Revenue (month)" value={formatMoney(data.revenueThisMonth)} hint={`${data.openInvoices} open · ${formatMoney(data.outstandingAmount)} due`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-6">
            <section className="surface p-4 lg:col-span-2">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-[14px] font-semibold">Revenue by day</h2>
                <span className="text-[12px] text-ink-muted">Paid invoices, this month</span>
              </div>
              <RevenueBars series={data.revenueByDay} />
            </section>

            <section className="surface p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-[14px] font-semibold">Top products</h2>
                <Link href="/products" className="text-[12px] text-accent hover:underline">All →</Link>
              </div>
              {data.topProducts.length === 0 ? (
                <div className="text-[13px] text-ink-muted">No sales yet.</div>
              ) : (
                <ul className="divide-y hairline">
                  {data.topProducts.map(p => (
                    <li key={p.productId} className="py-2.5 flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium truncate">{p.name}</div>
                        <div className="text-[11.5px] text-ink-muted font-mono">{p.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="num text-[13.5px] font-medium">{formatMoney(p.revenue)}</div>
                        <div className="text-[11.5px] text-ink-muted">{p.unitsSold} units</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="mt-6 flex items-center justify-between text-[12px] text-ink-muted">
            <span>Updated {formatDate(new Date(), true)}</span>
            {data.lowStockCount > 0 && (
              <Link href="/products?includeInactive=false" className="inline-flex items-center gap-2">
                <Badge tone="warn">Low stock</Badge>
                <span>{data.lowStockCount} product(s) need reordering</span>
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}

function RevenueBars({ series }: { series: { date: string; revenue: number }[] }) {
  if (series.length === 0) {
    return <div className="text-[13px] text-ink-muted h-24 flex items-center">No paid invoices this month.</div>;
  }
  const max = Math.max(...series.map(s => s.revenue), 1);
  return (
    <div className="h-40 flex items-end gap-1.5">
      {series.map(pt => {
        const h = Math.max(4, Math.round((pt.revenue / max) * 140));
        return (
          <div key={pt.date} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full bg-accent/70 group-hover:bg-accent rounded-sm" style={{ height: h }} title={`${pt.date}: ${pt.revenue}`} />
            <div className="text-[10px] text-ink-muted">{new Date(pt.date).getDate()}</div>
          </div>
        );
      })}
    </div>
  );
}
