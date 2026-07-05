"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { readUiHint } from "@/lib/auth/client";
import { deletePostAction, getPostOwnership } from "@/lib/content/actions";
import { Toast, type ToastData } from "@/components/Toast";

// Owner-only edit/delete controls for an article (FRONTEND §3.2 Journey D).
// Same session model as BookmarkButton: the article page is STATIC, so this
// island renders nothing on the server and stays empty for every viewer until
// getPostOwnership confirms — after mount — that the signed-in author owns this
// post. Delete re-verifies ownership server-side; the client only decides
// whether to show the button. Delete uses a two-step inline confirm (no
// window.confirm) so an accidental tap can't destroy a post.
export function AuthorPostControls({ postId, editHref }: { postId: string; editHref: string }) {
  const router = useRouter();
  const [canManage, setCanManage] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const hint = readUiHint();
    if (!hint || hint.r !== "author") return; // only authors can own posts
    let cancelled = false;
    getPostOwnership(postId).then((s) => {
      if (!cancelled) setCanManage(s.canManage);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (!canManage) return null;

  function onDelete() {
    setToast(null);
    startTransition(async () => {
      try {
        const res = await deletePostAction(postId);
        if (!res.ok) {
          setConfirming(false);
          setToast({ tone: "error", message: res.error ?? "লেখাটি মোছা গেল না।" });
          return;
        }
        // The article we're on is now gone — leave before it 404s, then refresh
        // so the author archive/listing no longer shows it.
        router.push(res.redirectTo ?? "/");
        router.refresh();
      } catch {
        setConfirming(false);
        setToast({ tone: "error", message: "সংযোগে সমস্যা হলো — আবার চেষ্টা করুন।" });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={editHref}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-bg-subtle px-3 py-2 text-meta text-text transition-colors hover:bg-border/40"
        >
          <PencilIcon />
          সম্পাদনা
        </Link>

        {confirming ? (
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="inline-flex min-h-[44px] items-center rounded-md border border-danger bg-transparent px-3 py-2 text-meta text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "মোছা হচ্ছে…" : "নিশ্চিত মুছুন"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 py-2 text-meta text-muted transition-colors hover:bg-border/40 disabled:opacity-50"
            >
              বাতিল
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-bg-subtle px-3 py-2 text-meta text-danger transition-colors hover:bg-danger/10"
          >
            <TrashIcon />
            মুছুন
          </button>
        )}
      </div>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}
