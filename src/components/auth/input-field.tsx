import { InputHTMLAttributes, ReactNode } from "react";

type InputFieldProps = {
  id: string;
  label: string;
  icon?: ReactNode;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function InputField({
  id,
  label,
  icon,
  error,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-aac-muted">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`aac-input auth-input ${icon ? "auth-input-with-icon" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
