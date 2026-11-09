import { GraduationCap } from 'lucide-react';

/** Letterhead used on printable student documents. */
export function DocumentHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-brand-800 pb-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-brand-800 p-2">
          <GraduationCap className="h-6 w-6 text-white" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-800 uppercase">University Education Management Portal</p>
          <p className="text-xs text-slate-500">Office of the Registrar</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
