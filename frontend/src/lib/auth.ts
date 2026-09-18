export type Role = 'Admin' | 'Manager' | 'Staff';

export interface CurrentUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

const TOKEN_KEY = 'inventra.token';
const USER_KEY = 'inventra.user';

export function saveSession(token: string, user: CurrentUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  return parseUser(localStorage.getItem(USER_KEY));
}

/** Raw stored session user, suitable as a `useSyncExternalStore` snapshot. */
export function getStoredUserRaw(): string {
  return localStorage.getItem(USER_KEY) ?? '';
}

export function parseUser(raw: string | null): CurrentUser | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as CurrentUser; } catch { return null; }
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function hasRole(user: CurrentUser | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
