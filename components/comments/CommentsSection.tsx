import type { Post } from "@/lib/content/types";
import { postHref } from "@/lib/content/repo";
import { commentsForPost, type Comment } from "@/lib/comments/store.mjs";
import { getUser } from "@/lib/auth/users.mjs";
import { formatDate, isoDate } from "@/lib/format";
import { CommentArea } from "./CommentArea";

const bnCount = new Intl.NumberFormat("bn-BD");

// Comment section (REBUILD §4 Phase 3 / FRONTEND §2.4 comment form & list).
// The THREAD is a server component on purpose: comment text is indexed content
// (REBUILD §1#4), so it must be in the SSG HTML, not behind a client fetch.
// Old-platform anchors are preserved verbatim — every <li> carries
// id="comment-{old id}" so backlinked `#comment-12345` permalinks resolve.
// Only the compose area (CommentArea) is a client island, keeping the article
// route's JS budget intact (§1.3: don't ship a comment widget's JS for the
// thread a reader only scrolls).
export function CommentsSection({ post }: { post: Post }) {
  const thread = commentsForPost(post.id);
  const count = thread.reduce((n, c) => n + 1 + c.replies.length, 0);
  const path = postHref(post);

  return (
    <section id="comments" aria-labelledby="comments-heading" className="mt-12 scroll-mt-24 border-t border-border pt-8">
      <h2 id="comments-heading" className="font-display text-h2 text-text">
        মন্তব্য ({bnCount.format(count)})
      </h2>

      {thread.length === 0 ? (
        // Empty state is an invitation, never a blank area (§3.4).
        <p className="mt-4 text-body text-muted">
          এখনও কোনো মন্তব্য নেই — প্রথম মন্তব্যটি আপনার হোক।
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-6">
          {thread.map((c) => (
            <li key={c.id} id={`comment-${c.id}`} className="scroll-mt-24">
              <CommentView comment={c} />
              {c.replies.length > 0 && (
                <ol className="mt-4 flex flex-col gap-4 border-s-2 border-border ps-4">
                  {c.replies.map((r) => (
                    <li key={r.id} id={`comment-${r.id}`} className="scroll-mt-24">
                      <CommentView comment={r} />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}

      <div id="comment-form" className="mt-8 scroll-mt-24">
        <CommentArea
          postId={post.id}
          postPath={path}
          topLevel={thread.map((c) => ({
            id: c.id,
            name: getUser(c.userId)?.name ?? "পাঠক",
          }))}
        />
      </div>
    </section>
  );
}

function CommentView({ comment }: { comment: Comment }) {
  const author = getUser(comment.userId);
  const isReply = comment.parentId !== null;
  return (
    <article aria-label={`মন্তব্য — ${author?.name ?? "পাঠক"}`}>
      <footer className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-meta font-medium text-text">{author?.name ?? "পাঠক"}</span>
        <time dateTime={isoDate(comment.createdAt)} className="text-caption text-muted">
          {formatDate(comment.createdAt)}
        </time>
      </footer>
      <p className="mt-1 text-body text-text">{comment.body}</p>
      {!isReply && (
        // Server-rendered <a>: reply targeting is URL state (?reply={id}) the
        // form island reads after mount — no per-comment client JS. Without JS
        // the link still lands on the form (§3.4 degradation: top-level reply).
        <a
          href={`?reply=${comment.id}#comment-form`}
          className="mt-1 inline-block text-meta text-link hover:underline"
        >
          উত্তর দিন
        </a>
      )}
    </article>
  );
}
