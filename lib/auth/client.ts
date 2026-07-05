// Client-side reader for the display-hint cookie (see lib/auth/session.ts for
// why the hint exists). Call only after mount (document access) — islands keep
// their SSR markup logged-out so static pages stay static and hydration never
// mismatches; the hint upgrades the UI in an effect.

export interface UiHint {
  /** Display name. */
  n: string;
  r: "reader" | "author";
}

export function readUiHint(): UiHint | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)lm_hint=([^;]*)/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(m[1]));
    if (typeof parsed?.n === "string" && (parsed?.r === "reader" || parsed?.r === "author")) {
      return parsed as UiHint;
    }
  } catch {
    /* corrupt hint = logged-out UI; the real session is unaffected */
  }
  return null;
}
