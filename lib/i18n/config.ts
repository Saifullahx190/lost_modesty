// UI-language (chrome) i18n — Bangla ⇄ English toggle for the site *chrome only*
// (nav, headings, buttons, footer, empty/search states). Blog CONTENT — article
// bodies, titles, excerpts, author names, category/tag names — is never translated
// and stays Bengali; this system only swaps interface labels.
//
// Design mirrors the no-flash THEME mechanism (app/layout.tsx): the choice lives in
// localStorage and is applied to a `data-lang` attribute on <html> by an inline
// script BEFORE first paint, so switching only flips an attribute — no flash, and,
// crucially, NO server `cookies()` read, so every article/category page stays SSG
// (REBUILD §2). Static text renders BOTH languages (<T bn en/>) and CSS shows one
// (app/globals.css); client-only attributes (aria-label/placeholder) read `useLang`.

export type Lang = "bn" | "en";

/** localStorage key holding the reader's chrome-language choice. */
export const LANG_KEY = "lang";

/** Default when nothing is stored — the site is Bengali-first (FRONTEND §0). */
export const DEFAULT_LANG: Lang = "bn";

// Runs before first paint (injected in layout <head>): sets data-lang from the
// stored choice so the CSS in globals.css shows the right language with no flash.
// Absent/invalid value → no attribute → CSS default (Bengali). Mirrors noFlashTheme.
export const NO_FLASH_LANG = `(function(){try{var l=localStorage.getItem('${LANG_KEY}');if(l==='en'||l==='bn'){document.documentElement.setAttribute('data-lang',l);}}catch(e){}})();`;
