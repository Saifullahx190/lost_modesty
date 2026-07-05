import { type TextareaHTMLAttributes, forwardRef, useId } from "react";

// M0 form primitive — the multi-line sibling of Input (FRONTEND §1.3 Forms), for
// the editor body/footnotes and the profile bio. Mirrors Input's contract exactly:
// an associated <label> (visually-hidden option), an optional hint, inline error
// tied via aria-describedby, and error announced via aria-live — not just a border.

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hideLabel?: boolean;
  /** Static helper text (e.g. markdown-lite syntax hint) tied via aria-describedby. */
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hideLabel = false, hint, error, id, className = "", ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className={hideLabel ? "sr-only" : "text-meta text-muted"}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`rounded-md border bg-bg-subtle px-3 py-2 text-body leading-relaxed text-text ${
          error ? "border-danger" : "border-border"
        } ${className}`.trim()}
        {...props}
      />
      <p id={errorId} role="alert" aria-live="polite" className="min-h-[1rem] text-caption text-danger">
        {error ?? ""}
      </p>
    </div>
  );
});
