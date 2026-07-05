"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { addComment } from "./store.mjs";
import { getPostById, postHref } from "@/lib/content/repo";

// Comment submit action (REBUILD §4 Phase 3 / FRONTEND §3.2 Journey E). The
// REAL session gates the write — the client island's hint cookie only decides
// which UI to render. On success the article path is revalidated, so the
// server-rendered thread (indexed comment text) picks the comment up through
// the same ISR pipeline the read path already uses.

export interface CommentFormState {
  ok?: boolean;
  formError?: string;
  fieldErrors?: { body?: string };
  /** Sticky on failure: the reader's typed text is never lost (§3.3/§3.4). */
  values?: { body?: string };
}

const ERROR_COPY: Record<string, string> = {
  EMPTY: "মন্তব্যটি লিখুন।",
  TOO_LONG: "মন্তব্যটি বড্ড দীর্ঘ — ৫০০০ অক্ষরের মধ্যে লিখুন।",
  UNKNOWN_POST: "লেখাটি খুঁজে পাওয়া গেল না — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।",
  BAD_PARENT: "যে মন্তব্যের উত্তর দিচ্ছেন সেটি আর নেই — পাতাটি রিফ্রেশ করুন।",
};

export async function postComment(
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const body = typeof formData.get("body") === "string" ? (formData.get("body") as string) : "";
  const postId = String(formData.get("postId") ?? "");
  const rawParent = formData.get("parentId");
  const parentId =
    typeof rawParent === "string" && rawParent.length > 0 ? rawParent : null;

  const user = await getSessionUser();
  if (!user) {
    // Shouldn't normally be reachable (logged-out UI shows the login CTA), but
    // sessions expire mid-compose — keep the text, say what happened (§3.4).
    return {
      formError: "সেশনটির মেয়াদ শেষ — নতুন ট্যাবে প্রবেশ করে ফিরে এসে আবার চেষ্টা করুন।",
      values: { body },
    };
  }

  const post = getPostById(postId);
  if (!post) return { formError: ERROR_COPY.UNKNOWN_POST, values: { body } };

  try {
    addComment({ postId, userId: user.id, body, parentId });
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    if (code === "EMPTY" || code === "TOO_LONG") {
      return { fieldErrors: { body: ERROR_COPY[code] }, values: { body } };
    }
    return {
      formError: ERROR_COPY[code] ?? "মন্তব্যটি পোস্ট করা গেল না — আবার চেষ্টা করুন।",
      values: { body },
    };
  }

  // ISR revalidation: the static article page regenerates with the new
  // comment; the client router refetches it when this action resolves.
  revalidatePath(postHref(post));
  return { ok: true };
}
