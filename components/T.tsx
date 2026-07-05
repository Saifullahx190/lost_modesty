// Translated chrome text. Renders BOTH languages inline; CSS (app/globals.css,
// keyed off <html data-lang>) shows exactly one, so this works in SERVER components
// with zero client JS and no flash — the whole point of the SSG-preserving i18n
// approach (lib/i18n/config.ts). The English span carries lang="en" so screen
// readers switch voice for it (the page root stays lang="bn" because the CONTENT
// is Bengali). The hidden span is display:none, so assistive tech reads only one.
//
// Use for STATIC visible text. For attributes (aria-label/placeholder) a client
// island must use `useT()` instead — CSS can't toggle an attribute.
export function T({ bn, en }: { bn: string; en: string }) {
  return (
    <>
      <span data-i18n="bn">{bn}</span>
      <span data-i18n="en" lang="en">
        {en}
      </span>
    </>
  );
}
