"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { readUiHint } from "@/lib/auth/client";
import { getBookmarkState, toggleBookmarkAction } from "@/lib/bookmarks/actions";
import { Toast, type ToastData } from "@/components/Toast";

// Bookmark button (FRONTEND §2.4 states: unsaved, saved, saving/optimistic,
// error/rollback; §3.3 bookmark toggle). The saved state is confirmed with
// VISIBLE TEXT + aria-pressed, not just an icon fill (§2.4 accessibility note),
// and a toast announces the result. On server error the icon reverts and the
// toast explains what happened — never a silent failure.
//
// Session model (same as CommentArea): hint cookie after mount picks the UI;
// the real state comes from getBookmarkState; every write re-verifies the
// HttpOnly session server-side. Logged-out click → /login with a return path.
export function BookmarkButton({ postId, postPath }: { postId: string; postPath: string }) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!readUiHint()) return; // stays a logged-out login-CTA button
    let cancelled = false;
    getBookmarkState(postId).then((s) => {
      if (cancelled) return;
      setLoggedIn(s.loggedIn);
      setSaved(s.saved);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  function onClick() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(postPath)}`);
      return;
    }
    const optimistic = !saved;
    setSaved(optimistic); // §3.3: optimistic flip…
    setToast(null);
    startTransition(async () => {
      try {
        const result = await toggleBookmarkAction(postId);
        if (!result.ok) {
          setSaved(!optimistic); // …rollback on failure…
          setToast({ tone: "error", message: result.error ?? "সংরক্ষণ করা গেল না।" });
          if (!result.loggedIn) router.push(`/login?next=${encodeURIComponent(postPath)}`);
          return;
        }
        setSaved(result.saved); // …server state wins on success.
        setToast({
          tone: "success",
          message: result.saved ? "লেখাটি সংরক্ষিত হয়েছে।" : "সংরক্ষণ থেকে সরানো হয়েছে।",
        });
      } catch {
        setSaved(!optimistic);
        setToast({ tone: "error", message: "সংযোগে সমস্যা হলো — আবার চেষ্টা করুন।" });
      }
    });
  }

  const label = saved ? "সংরক্ষিত" : "সংরক্ষণ";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        disabled={pending}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-bg-subtle px-3 py-2 text-meta text-text transition-colors hover:bg-border/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <BookmarkIcon filled={saved} />
        {label}
      </button>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 4h12v17l-6-4-6 4V4Z" />
    </svg>
  );
}
