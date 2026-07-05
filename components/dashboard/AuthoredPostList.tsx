"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "@/lib/content/actions";
import { Toast, type ToastData } from "@/components/Toast";

// The author's own published posts on the dashboard, each with edit + delete
// (FRONTEND §3.2 Journey D). Unlike the article-page controls, the dashboard is
// already SSR + author-gated, so there's no ownership probe here — the server
// only renders this for the signed-in author, and deletePostAction re-verifies
// ownership anyway. Delete STAYS on the dashboard (router.refresh drops the row),
// rather than the article-page behaviour of redirecting to the archive.

export interface AuthoredPostRow {
  id: string;
  title: string;
  href: string;
  editHref: string;
  dateLabel: string;
}

export function AuthoredPostList({ posts }: { posts: AuthoredPostRow[] }) {
  const [toast, setToast] = useState<ToastData | null>(null);

  if (posts.length === 0) {
    return (
      <p className="text-body text-muted">
        এখনো কিছু প্রকাশ করেননি।{" "}
        <Link
          href="/editor"
          className="text-link hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        >
          নতুন লেখা লিখুন →
        </Link>
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border">
        {posts.map((p) => (
          <AuthoredRow key={p.id} post={p} onError={(m) => setToast({ tone: "error", message: m })} />
        ))}
      </ul>
      <div className="mt-3">
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    </>
  );
}

function AuthoredRow({ post, onError }: { post: AuthoredPostRow; onError: (m: string) => void }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      try {
        const res = await deletePostAction(post.id);
        if (!res.ok) {
          setConfirming(false);
          onError(res.error ?? "লেখাটি মোছা গেল না।");
          return;
        }
        // Stay on the dashboard; re-fetch so this row (and its listings) drop away.
        router.refresh();
      } catch {
        setConfirming(false);
        onError("সংযোগে সমস্যা হলো — আবার চেষ্টা করুন।");
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
      <div className="flex min-w-0 flex-col">
        <Link
          href={post.href}
          className="line-clamp-1 text-body text-text hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        >
          {post.title}
        </Link>
        <span className="text-caption text-muted">{post.dateLabel}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={post.editHref}
          className="inline-flex min-h-[40px] items-center rounded-md border border-border bg-bg-subtle px-3 py-1.5 text-meta text-text transition-colors hover:bg-border/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        >
          সম্পাদনা
        </Link>

        {confirming ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="inline-flex min-h-[40px] items-center rounded-md border border-danger bg-transparent px-3 py-1.5 text-meta text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "মোছা হচ্ছে…" : "নিশ্চিত মুছুন"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="inline-flex min-h-[40px] items-center rounded-md border border-border px-3 py-1.5 text-meta text-muted transition-colors hover:bg-border/40 disabled:opacity-50"
            >
              বাতিল
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex min-h-[40px] items-center rounded-md border border-border bg-bg-subtle px-3 py-1.5 text-meta text-danger transition-colors hover:bg-danger/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          >
            মুছুন
          </button>
        )}
      </div>
    </li>
  );
}
