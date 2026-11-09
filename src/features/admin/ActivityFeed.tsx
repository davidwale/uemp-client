import { History } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { actionLabel, formatDate } from '@/lib/utils';
import type { ActivityItem } from '@/types/api';

const describe = (m: Record<string, unknown> | null) => {
  if (!m) return null;
  const parts = [m.courseCode, m.label, m.email, Array.isArray(m.courses) ? (m.courses as string[]).join(', ') : null].filter(
    (x): x is string => typeof x === 'string' && x.length > 0,
  );
  return parts.join(' · ') || null;
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <EmptyState icon={History} title="No recent activity" />;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-slate-800">{actionLabel(a.action)}</p>
            <p className="truncate text-xs text-slate-500">
              {a.actor}
              {describe(a.metadata) ? ` · ${describe(a.metadata)}` : ''}
            </p>
          </div>
          <time className="shrink-0 text-xs text-slate-400">{formatDate(a.createdAt, true)}</time>
        </li>
      ))}
    </ul>
  );
}
