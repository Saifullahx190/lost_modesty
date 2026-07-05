import { type InputHTMLAttributes, forwardRef, useId } from "react";

// M0 primitive (FRONTEND §5.2 + §1.3 Forms). Every input has an associated <label>
// (visually-hidden option for placeholder-pattern designs), inline errors tied via
// aria-describedby, and error announced via aria-live — not just a red border.

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Visually hide the label but keep it for screen readers (§1.3). */
  hideLabel?: boolean;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel = false, error, id, className = "", ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={hideLabel ? "sr-only" : "text-meta text-muted"}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-md border bg-bg-subtle px-3 py-2 text-body text-text min-h-[44px] ${
          error ? "border-danger" : "border-border"
        } ${className}`.trim()}
        {...props}
      />
      {/* aria-live so the error is announced, not just visually shown (§1.3). */}
      <p id={errorId} role="alert" aria-live="polite" className="text-caption text-danger min-h-[1rem]">
        {error ?? ""}
      </p>
    </div>
  );
});
