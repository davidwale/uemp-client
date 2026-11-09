import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
} as const;

export type Tone = keyof typeof tones;

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const resultTones: Record<string, { tone: Tone; label: string }> = {
  NOT_STARTED: { tone: 'neutral', label: 'Not started' },
  DRAFT: { tone: 'info', label: 'Draft' },
  SUBMITTED: { tone: 'warning', label: 'Awaiting approval' },
  APPROVED: { tone: 'success', label: 'Approved' },
  REJECTED: { tone: 'danger', label: 'Returned for correction' },
};

export function ResultStatusBadge({ status }: { status: string }) {
  const s = resultTones[status] ?? { tone: 'neutral' as Tone, label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const userTones: Record<string, Tone> = { ACTIVE: 'success', INACTIVE: 'neutral', SUSPENDED: 'danger' };

export function UserStatusBadge({ status }: { status: string }) {
  return <Badge tone={userTones[status] ?? 'neutral'}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-slate-400">—</span>;
  const tone: Tone = grade === 'A' ? 'success' : grade === 'F' ? 'danger' : grade === 'E' || grade === 'D' ? 'warning' : 'brand';
  return (
    <Badge tone={tone} className="min-w-7 justify-center">
      {grade}
    </Badge>
  );
}
