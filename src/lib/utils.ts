import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ApiError } from './api';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (value: string | Date | null | undefined, withTime = false) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

export const formatNumber = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined ? '—' : n.toFixed(digits);

export const errorMessage = (err: unknown) =>
  err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Something went wrong';

export const ROLE_LABELS = {
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  DEPT_ADMIN: 'Department Admin',
  SUPER_ADMIN: 'Super Admin',
} as const;

export const levelLabel = (level: number | null | undefined) => (level ? `${level}L` : '—');

/** Humanises an audit action key, e.g. "result.draft_saved" → "Result draft saved". */
export const actionLabel = (action: string) => {
  const text = action.replace(/[._]/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};
