const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'CHF',
  minimumFractionDigits: 2
});

export function formatMoney(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n)) return '—';
  return money.format(n);
}

export function formatDate(v: string | Date | null | undefined, withTime = false): string {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-CH', { year: 'numeric', month: 'short', day: '2-digit' });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('en-CH', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
