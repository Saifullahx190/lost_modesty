import { MarigoldMark } from "@/components/Logo";

// Shared narrow-card chrome for /login and /register (M2). Kept deliberately
// quiet: marigold motif + heading + form, nothing competing with the fields.
// This is the page most likely used by a stressed, locked-out returning user
// (FRONTEND §5.2 M2) — no decoration that costs clarity.
export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <MarigoldMark className="h-10 w-10 text-accent" />
        <h1 className="font-display text-display text-text">{title}</h1>
        <p className="text-meta text-muted">{intro}</p>
      </div>
      {children}
    </div>
  );
}
