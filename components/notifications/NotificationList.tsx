import Link from "next/link";
import type { NotificationItem } from "@/lib/notifications/feed";
import { formatDate, isoDate } from "@/lib/format";

// Notification list (FRONTEND §2.4). Server component — a read of derived events.
// Unread rows get a marigold marker + subtle fill; each names the actor + what
// they did and links to the exact comment (`#comment-{id}`) on the article.

const VERB: Record<NotificationItem["type"], string> = {
  reply: "আপনার মন্তব্যে উত্তর দিয়েছেন",
  comment_on_post: "আপনার লেখায় মন্তব্য করেছেন",
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item) => (
        <li
          key={item.commentId}
          className={`flex gap-3 border-b border-border px-3 py-4 last:border-b-0 ${
            item.unread ? "bg-bg-subtle" : ""
          }`}
        >
          <span
            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${item.unread ? "bg-accent" : "bg-transparent"}`}
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body text-text">
              <span className="font-medium">{item.actor}</span>{" "}
              <span className="text-muted">{VERB[item.type]} — </span>
              <Link
                href={`${item.post.href}#comment-${item.commentId}`}
                className="text-link hover:underline underline-offset-2"
              >
                {item.post.title}
              </Link>
              {item.unread && <span className="sr-only"> (নতুন)</span>}
            </p>
            <p className="line-clamp-2 text-meta text-muted">“{item.snippet}”</p>
            <time dateTime={isoDate(item.date)} className="text-caption text-muted">
              {formatDate(item.date)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
