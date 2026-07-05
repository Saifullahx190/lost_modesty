"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { useSearchParams } from "next/navigation";
import { postComment, type CommentFormState } from "@/lib/comments/actions";
import { Button } from "@/components/Button";

// Comment form (FRONTEND §2.4 states: empty, composing, submitting, submitted,
// error, nested reply — §3.2 Journey E). Submitting is a NAMED action label
// ("পোস্ট হচ্ছে…"), failure keeps the typed text (sticky defaultValue after
// React's post-action form reset), success announces via role="status" and the
// revalidated thread re-renders with the published comment.
//
// Reply targeting: ?reply={id} in the URL (set by the thread's server-rendered
// links) → hidden parentId. Client-side only; unknown ids degrade to top-level.
export function CommentForm({
  postId,
  readerName,
  topLevel,
}: {
  postId: string;
  readerName: string;
  topLevel: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<CommentFormState, FormData>(postComment, {});
  const params = useSearchParams();
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  const replyRaw = params.get("reply");
  const replyTo = topLevel.find((c) => c.id === replyRaw);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="parentId" value={replyTo?.id ?? ""} />

      <p role="alert" aria-live="polite" className="min-h-[1.25rem] text-meta text-danger">
        {state.formError ?? ""}
      </p>

      {replyTo && (
        <p className="text-meta text-muted">
          {replyTo.name}-এর মন্তব্যের উত্তর দিচ্ছেন।{" "}
          <Link href="#comment-form" className="text-link hover:underline">
            বাতিল করুন
          </Link>
        </p>
      )}

      <label htmlFor={fieldId} className="text-meta text-muted">
        {readerName} হিসেবে মন্তব্য করছেন
      </label>
      <textarea
        id={fieldId}
        name="body"
        rows={4}
        required
        maxLength={5000}
        defaultValue={state.values?.body ?? ""}
        aria-invalid={state.fieldErrors?.body ? true : undefined}
        aria-describedby={state.fieldErrors?.body ? errorId : undefined}
        placeholder="আপনার ভাবনা লিখুন…"
        className={`rounded-md border bg-bg-subtle px-3 py-2 text-body text-text placeholder:text-muted ${
          state.fieldErrors?.body ? "border-danger" : "border-border"
        }`}
      />
      <p id={errorId} role="alert" aria-live="polite" className="min-h-[1rem] text-caption text-danger">
        {state.fieldErrors?.body ?? ""}
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending} loadingLabel="পোস্ট হচ্ছে…">
          মন্তব্য পোস্ট করুন
        </Button>
        {/* Submitted state: confirmation that stays until the next compose. */}
        <p role="status" aria-live="polite" className="text-meta text-success">
          {state.ok && !pending ? "মন্তব্যটি প্রকাশিত হয়েছে।" : ""}
        </p>
      </div>
    </form>
  );
}
