import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn, errorMessage } from '@/lib/utils';
import { Button } from './Button';

export function Spinner({ className, label = 'Loading…' }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-12 text-sm text-slate-500', className)} role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Info,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3">
        <Icon className="h-6 w-6 text-slate-400" aria-hidden />
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Couldn’t load this data"
      description={errorMessage(error)}
      action={onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    />
  );
}

const alertTones = {
  info: { icon: Info, cls: 'border-sky-200 bg-sky-50 text-sky-900' },
  success: { icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  warning: { icon: AlertTriangle, cls: 'border-amber-200 bg-amber-50 text-amber-900' },
  danger: { icon: AlertCircle, cls: 'border-red-200 bg-red-50 text-red-900' },
} as const;

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof alertTones;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, cls } = alertTones[tone];
  return (
    <div className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', cls, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="space-y-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  );
}
