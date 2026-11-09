import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full min-w-full text-left text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export const THead = ({ children }: { children: ReactNode }) => (
  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium tracking-wide text-slate-500 uppercase">
    {children}
  </thead>
);

export const TBody = ({ children }: { children: ReactNode }) => <tbody className="divide-y divide-slate-100">{children}</tbody>;

export const Th = ({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th scope="col" className={cn('px-4 py-3 whitespace-nowrap', className)} {...props} />
);

export const Td = ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-4 py-3 align-middle', className)} {...props} />
);

export const Tr = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('hover:bg-slate-50/60', className)} {...props} />
);
