import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const control =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Wires a label, hint and error message to a control with correct ARIA attributes. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type WithField = { label?: string; error?: string; hint?: string; containerClassName?: string };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & WithField>(
  ({ label, error, hint, containerClassName, className, required, ...props }, ref) => (
    <Field label={label} error={error} hint={hint} required={required} className={containerClassName}>
      {(id, describedBy) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          required={required}
          className={cn(control, 'h-10', className)}
          {...props}
        />
      )}
    </Field>
  ),
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & WithField>(
  ({ label, error, hint, containerClassName, className, required, children, ...props }, ref) => (
    <Field label={label} error={error} hint={hint} required={required} className={containerClassName}>
      {(id, describedBy) => (
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          required={required}
          className={cn(control, 'h-10 pr-8', className)}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  ),
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & WithField>(
  ({ label, error, hint, containerClassName, className, required, ...props }, ref) => (
    <Field label={label} error={error} hint={hint} required={required} className={containerClassName}>
      {(id, describedBy) => (
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          required={required}
          className={cn(control, 'min-h-24 py-2', className)}
          {...props}
        />
      )}
    </Field>
  ),
);
Textarea.displayName = 'Textarea';
