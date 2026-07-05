import { type ButtonHTMLAttributes, forwardRef } from "react";

// M0 primitive (FRONTEND §5.2: "button ... focus states"). NOTE: a generic Button
// is NOT in the §2.4 component table, so this is intentionally minimal — a
// foundation for forms/auth, not a new design surface. B1 is now resolved (the
// action text color is --color-link), but no accent-fill "primary" variant is
// defined here yet: a solid marigold fill needs dark text and is a design decision
// beyond B1, deferred to the relevant component milestone. Variants below are all
// contrast-verified token pairings.

type Tone = "neutral" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  loading?: boolean;
  /** Label shown while loading — name the action, don't just spin (FRONTEND §3.3). */
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { tone = "neutral", loading = false, loadingLabel, children, disabled, className = "", ...props },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-meta font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"; // ≥44px tap target (§1.3)
  const tones: Record<Tone, string> = {
    neutral: "bg-bg-subtle text-text border-border hover:bg-border/40",
    danger: "bg-transparent text-danger border-danger hover:bg-danger/10",
  };
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${tones[tone]} ${className}`.trim()}
      {...props}
    >
      {loading ? (loadingLabel ?? "অপেক্ষা করুন…") : children}
    </button>
  );
});
