'use client';

import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, ...rest }, ref
) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none';
  const sizes = { sm: 'h-7 px-2.5 text-[13px]', md: 'h-9 px-3.5 text-sm' };
  const variants = {
    primary: 'bg-ink text-paper hover:bg-ink-soft',
    secondary: 'bg-paper-card text-ink border border-line hover:bg-paper-hover',
    ghost: 'bg-transparent text-ink hover:bg-paper-hover',
    danger: 'bg-paper-card text-danger border border-line hover:bg-paper-hover'
  };
  return <button ref={ref} className={cn(base, sizes[size], variants[variant], className)} {...rest} />;
});

type FieldProps = { label: string; hint?: string; error?: string; children: React.ReactNode };
export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-ink font-medium">{label}</span>
        {hint && <span className="text-[12px] text-ink-muted">{hint}</span>}
      </div>
      {children}
      {error && <div className="mt-1 text-[12px] text-danger">{error}</div>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest }, ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full h-9 px-2.5 text-sm bg-paper-card border border-line rounded',
        'placeholder:text-ink-faint focus:border-accent focus:outline-none',
        className
      )}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest }, ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full h-9 px-2.5 text-sm bg-paper-card border border-line rounded',
        'focus:border-accent focus:outline-none',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest }, ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-2.5 py-2 text-sm bg-paper-card border border-line rounded',
        'placeholder:text-ink-faint focus:border-accent focus:outline-none',
        className
      )}
      {...rest}
    />
  );
});

type BadgeProps = {
  tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'ok';
  children: React.ReactNode;
};
export function Badge({ tone = 'neutral', children }: BadgeProps) {
  const tones = {
    neutral: 'bg-paper-hover text-ink border-line',
    accent: 'bg-accent-soft text-accent border-accent/20',
    warn: 'bg-[#fef7e6] text-warn border-[#f5e4b6]',
    danger: 'bg-[#fdecec] text-danger border-[#f5c2c2]',
    ok: 'bg-accent-soft text-accent border-accent/20'
  };
  return (
    <span className={cn(
      'inline-flex items-center h-5 px-1.5 rounded border text-[11px] font-medium uppercase tracking-wide',
      tones[tone]
    )}>
      {children}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="surface p-10 text-center">
      <div className="text-sm font-medium text-ink">{title}</div>
      {hint && <div className="mt-1 text-[13px] text-ink-muted">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 border-b hairline pb-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface p-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 num text-[22px] font-semibold text-ink">{value}</div>
      {hint && <div className="mt-1 text-[12px] text-ink-muted">{hint}</div>}
    </div>
  );
}
