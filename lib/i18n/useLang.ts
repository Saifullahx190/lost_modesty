"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_LANG, LANG_KEY, type Lang } from "./config";

// Reactive read of the chrome language for CLIENT islands that must translate
// things CSS can't reach — aria-labels, placeholders, titles (attributes have no
// DOM node to hide/show). Static visible TEXT should use <T> instead (works in
// server components, zero JS). Backed by the same localStorage key the no-flash
// script reads, so all consumers — the toggle, the header buttons, search — stay
// in lockstep. useSyncExternalStore handles the SSR→client value handoff without a
// hydration error (getServerSnapshot renders the default, then it reconciles).

const EVENT = "lm:langchange";

function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "bn";
  } catch {
    return DEFAULT_LANG;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  // Cross-tab: a change in another tab fires `storage`.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Current chrome language, re-rendering the caller when it changes. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => DEFAULT_LANG);
}

/** Persist + apply a new chrome language and notify every `useLang` subscriber.
 *  Sets the same `data-lang` attribute the no-flash script uses, so the CSS-driven
 *  <T> text swaps in the same tick as the client labels. */
export function setLang(next: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    /* storage blocked — the in-session swap below still works */
  }
  document.documentElement.setAttribute("data-lang", next);
  window.dispatchEvent(new Event(EVENT));
}

/** Convenience picker for client components: `const t = useT(); t("বাংলা","English")`. */
export function useT(): (bn: string, en: string) => string {
  const lang = useLang();
  return (bn, en) => (lang === "en" ? en : bn);
}
