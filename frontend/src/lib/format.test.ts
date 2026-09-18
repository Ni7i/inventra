import { describe, expect, it } from 'vitest';
import { cn, formatDate, formatMoney } from './format';

describe('formatMoney', () => {
  it('formats numbers and numeric strings as CHF', () => {
    expect(formatMoney(1234.5)).toBe(formatMoney('1234.5'));
    expect(formatMoney(1234.5)).toContain('1,234.50');
  });

  it('returns a dash for missing or invalid values', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney('abc')).toBe('—');
  });
});

describe('formatDate', () => {
  it('returns a dash for missing or invalid dates', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date')).toBe('—');
  });

  it('appends the time only when requested', () => {
    const d = new Date(2026, 0, 15, 9, 30);
    expect(formatDate(d)).not.toContain('·');
    expect(formatDate(d, true)).toContain('·');
  });
});

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
