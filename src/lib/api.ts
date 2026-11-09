/**
 * Thin, typed wrapper around fetch. The session lives in an httpOnly cookie,
 * so no token handling happens in JavaScript — `credentials: 'include'` is all
 * that's needed.
 */
const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

export interface FieldIssue {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field-level validation issues, when the server returned them. */
  get fieldIssues(): FieldIssue[] {
    return Array.isArray(this.details) && this.details.every((d) => typeof d === 'object' && d && 'field' in d)
      ? (this.details as FieldIssue[])
      : [];
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export function toQueryString(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = payload?.error;
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? `Request failed (${res.status})`, err?.details);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', `${path}${toQueryString(query)}`),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};

/** Builds a URL for direct navigation (e.g. CSV downloads). */
export const apiUrl = (path: string, query?: Query) => `${BASE_URL}${path}${toQueryString(query)}`;

export interface DataResponse<T> {
  data: T;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
