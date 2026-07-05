import type { ReactNode } from "react";

// Shared shell for simple prose routes (about / our-work) — the same index-width
// container and display heading as IndexView, so these static pages sit in the
// same visual system as the archives (FRONTEND §3.1). Body copy is constrained to
// the article measure for comfortable Bengali long-form reading.
export function SimplePage({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-index px-4 py-10">
      <div className="mb-8 flex flex-col gap-4">
        <h1 className="font-display text-display text-text">{title}</h1>
        {lede && <p className="max-w-article text-body text-muted">{lede}</p>}
      </div>
      {children && (
        <div className="flex max-w-article flex-col gap-4 text-body text-text">
          {children}
        </div>
      )}
    </div>
  );
}
