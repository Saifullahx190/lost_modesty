"use client";

import { useEffect } from "react";

// Toast / inline confirmation (FRONTEND §2.4: success, error, neutral/info).
// Deliberately a LOCAL, presentational component — no global provider mounted
// in the root layout, because that would ship toast JS to every reading-only
// page (§1.3 JS budget). Islands that need one (bookmark, profile form) own
// their toast state and render this next to the control that caused it, which
// also keeps the message near the reader's focus point.
//
// Errors use role="alert" (assertive), confirmations role="status" (polite).
// Entrance animation is motion-safe only; auto-dismiss never applies to
// errors (a reader must not have to race an error message).

export type ToastTone = "success" | "error" | "info";

export interface ToastData {
  tone: ToastTone;
  message: string;
}

const toneClass: Record<ToastTone, string> = {
  success: "border-success text-success",
  error: "border-danger text-danger",
  info: "border-border text-muted",
};

export function Toast({
  toast,
  onDismiss,
  autoDismissMs = 4000,
}: {
  toast: ToastData | null;
  onDismiss: () => void;
  /** Applies to success/info only; errors stay until dismissed. */
  autoDismissMs?: number;
}) {
  useEffect(() => {
    if (!toast || toast.tone === "error") return;
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [toast, autoDismissMs, onDismiss]);

  // Live region stays mounted even when empty so announcements always land.
  return (
    <div
      role={toast?.tone === "error" ? "alert" : "status"}
      aria-live={toast?.tone === "error" ? "assertive" : "polite"}
      className="min-h-[1.5rem]"
    >
      {toast && (
        <span
          className={`inline-flex items-center gap-2 rounded-md border bg-bg-subtle px-3 py-1 text-meta motion-safe:animate-[toast-in_150ms_ease-out] ${toneClass[toast.tone]}`}
        >
          {toast.message}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="বার্তাটি বন্ধ করুন"
            className="grid h-6 w-6 place-items-center rounded text-current hover:bg-border/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      )}
    </div>
  );
}
