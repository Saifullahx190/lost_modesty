"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readUiHint, type UiHint } from "@/lib/auth/client";
import { CommentForm } from "./CommentForm";

// Compose-area island (Phase 3). Decides login-CTA vs form from the display
// hint AFTER mount so the article page stays fully static (see
// lib/auth/session.ts). SSR + no-JS default is the login CTA with a return
// path back to #comments (§3.4: never a dead click); a logged-in no-JS reader
// who follows it is bounced straight back by /login's already-signed-in
// redirect. The server action re-verifies the real session on every submit.
export function CommentArea({
  postId,
  postPath,
  topLevel,
}: {
  postId: string;
  postPath: string;
  topLevel: { id: string; name: string }[];
}) {
  const [hint, setHint] = useState<UiHint | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHint(readUiHint());
    setMounted(true);
  }, []);

  if (!mounted || hint === null) {
    return (
      <p className="text-body text-muted">
        মন্তব্য করতে{" "}
        <Link
          href={`/login?next=${encodeURIComponent(`${postPath}#comments`)}`}
          className="text-link hover:underline"
        >
          প্রবেশ করুন
        </Link>
        {" — ফিরে আসবেন ঠিক এখানেই।"}
      </p>
    );
  }

  return <CommentForm postId={postId} readerName={hint.n} topLevel={topLevel} />;
}
