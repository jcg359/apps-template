import clsx from 'clsx';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const baseField =
  'w-full bg-paper-elevated border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-accent-pending focus:outline-none transition-colors font-mono';

export function Label({
  children,
  htmlFor,
  required,
}: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block section-numeral mb-1.5"
    >
      {children}
      {required ? <span className="text-accent-pending"> *</span> : null}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={clsx(baseField, className)} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={clsx(baseField, 'font-sans', className)} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={clsx(baseField, 'font-sans', className)}>
      {children}
    </select>
  );
}

export function FieldGroup({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-ink-500 italic font-display">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-status-impersonation">{error}</p> : null}
    </div>
  );
}

export function Checkbox({
  label,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input {...rest} type="checkbox" className="accent-ink-900" />
      <span className="text-sm text-ink-800">{label}</span>
    </label>
  );
}
