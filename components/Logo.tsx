import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

// Logo lockup: the marigold mark + wordmark (FRONTEND §0 "marigold/floral mark …
// used as a quiet recurring motif", §2.4 header). The mark is the brand PNG
// (public/covers/lost_modesty_logo.png) and is decorative (empty alt) — the
// accessible name comes from the Link's aria-label + the wordmark text, so the
// image is not double-announced.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — ${SITE.nameLatin}`}
      className={`inline-flex items-center gap-2 ${className}`.trim()}
    >
      <Image
        src="/covers/lost_modesty_logo.png"
        alt=""
        width={28}
        height={28}
        priority
        className="h-7 w-7 shrink-0 object-contain"
      />
      <span className="font-display text-card-title leading-none text-text">
        {SITE.name} <span className="text-accent">ব্লগ</span>
      </span>
    </Link>
  );
}

// Recurring marigold motif — also reused in the empty/loading/404 states (§0).
// Renders the brand PNG (public/covers/lost_modesty_logo.png). Decorative
// (aria-hidden/empty alt): every call site pairs it with visible text, so it's
// never the sole accessible name. Callers set the display size via className
// (h-6/h-10/h-12 …); width/height below are only the intrinsic hint for next/image.
export function MarigoldMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/covers/lost_modesty_logo.png"
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      className={`object-contain ${className}`.trim()}
    />
  );
}
