"use client";

import { setLang, useLang } from "@/lib/i18n/useLang";

// Language toggle (chrome Bangla ⇄ English). Sibling of ThemeToggle in the header:
// same 44×44 hit area and idiom. The no-flash inline script in layout.tsx has
// already applied the stored language before paint; this island only handles the
// interactive swap + persistence (via lib/i18n/useLang). The badge shows the
// language you'd switch TO, so the affordance reads as an action, not a status.
export function LanguageToggle() {
  const lang = useLang();
  const next = lang === "en" ? "bn" : "en";
  // aria-label is itself translated so the control announces correctly in-language.
  const label = lang === "en" ? "বাংলায় দেখুন" : "View in English";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={label}
      title={label}
      className="grid h-11 min-w-11 place-items-center rounded-md px-2 text-meta font-medium text-text transition-colors hover:bg-bg-subtle"
    >
      {/* Decorative: the accessible name is the aria-label above. */}
      <span aria-hidden="true">{lang === "en" ? "বাং" : "EN"}</span>
    </button>
  );
}
