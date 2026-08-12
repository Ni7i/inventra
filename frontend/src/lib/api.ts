import { getToken, clearToken } from './auth';

export class ApiError extends Error {
  status: number;
  detail?: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers, cache: 'no-store' });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined' && !path.endsWith('/api/auth/login')) {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    const detail = data && typeof data === 'object' && 'detail' in data
      ? String((data as { detail?: string }).detail)
      : res.statusText;
    throw new ApiError(res.status, res.statusText, detail);
  }

  return data as T;
}

function safeParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}
