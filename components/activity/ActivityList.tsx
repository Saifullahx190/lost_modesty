import Link from "next/link";
import type { ActivityItem } from "@/lib/activity/feed";
import { formatDate, isoDate } from "@/lib/format";

// Recent-activity list (REBUILD §4 Phase 6 #11). A server component — no
// interactivity, just a time-ordered read of the user's own events. Each row
// names the action (not just an icon), links to the exact article (comments to
// their `#comment-{id}` anchor), and shows a real date; comments add a one-line
// preview of what was written.

const VERB: Record<ActivityItem["kind"], string> = {
  comment: "মন্তব্য করেছেন",
  bookmark: "সংরক্ষণ করেছেন",
  post: "প্রকাশ করেছেন",
};

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => {
        const href =
          item.kind === "comment" && item.commentId
            ? `${item.post.href}#comment-${item.commentId}`
            : item.post.href;
        return (
          <li
            key={`${item.kind}-${item.commentId ?? item.post.href}-${i}`}
            className="flex gap-3 border-b border-border py-4 last:border-b-0"
          >
            <span className="mt-0.5 shrink-0 text-muted" aria-hidden="true">
              <KindIcon kind={item.kind} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-body text-text">
                <span className="text-muted">{VERB[item.kind]} — </span>
                <Link href={href} className="text-link hover:underline underline-offset-2">
                  {item.post.title}
                </Link>
              </p>
              {item.snippet && (
                <p className="line-clamp-2 text-meta text-muted">“{item.snippet}”</p>
              )}
              <time dateTime={isoDate(item.date)} className="text-caption text-muted">
                {formatDate(item.date)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function KindIcon({ kind }: { kind: ActivityItem["kind"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
  };
  if (kind === "comment") {
    return (
      <svg {...common}>
        <path d="M4 5h16v11H8l-4 3V5Z" />
      </svg>
    );
  }
  if (kind === "bookmark") {
    return (
      <svg {...common}>
        <path d="M6 4h12v17l-6-4-6 4V4Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 4h9l5 5v11H5V4Z" />
      <path d="M14 4v5h5" />
    </svg>
  );
}
