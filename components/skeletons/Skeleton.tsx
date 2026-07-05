// Base skeleton block. bg-subtle fill (a real surface token, visible in both
// themes); shimmer only under motion-safe so prefers-reduced-motion gets a static
// placeholder (FRONTEND §1.3 reduced motion). Always decorative → aria-hidden; the
// loading announcement lives once on the page-level container, not per block.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded bg-bg-subtle motion-safe:animate-pulse ${className}`.trim()}
    />
  );
}

// Wraps a route's loading UI: marks the region busy and gives screen readers a single
// spoken "loading" cue instead of narrating every shimmer block.
export function LoadingRegion({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">লোড হচ্ছে…</span>
      {children}
    </div>
  );
}
