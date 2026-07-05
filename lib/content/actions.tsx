"use server";

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  getPost,
  getPostById,
  addPost,
  updatePost,
  deletePost,
  nextPostId,
  postHref,
} from "@/lib/content/repo";
import { validateDraft, buildDraftPost } from "@/lib/content/draft.mjs";
import {
  decodeImageUpload,
  inlineUpload,
  isUploadError,
  persistUpload,
} from "@/lib/content/uploads";
import { ArticlePreview } from "@/components/editor/ArticlePreview";

// Editor server actions (REBUILD §4 Phase 5 / FRONTEND §3.2 Journey D). Author-
// gated: the real HttpOnly session is re-verified here on every call (the hint
// cookie only chose which UI to draw), and only role=author may preview/publish
// — the writing panel is author-facing (REBUILD §1#7).
//
// The KEY property (Checkpoint 5): both preview and publish build the draft with
// the SAME buildDraftPost → Post, and the preview renders it through the SAME
// ArticleView the live route uses. There is no second renderer to diverge from,
// so a published post's canonical/meta/structured-data is byte-equivalent to a
// hand-authored one by construction (REBUILD §6.2 "same rendering path").

export interface ComposerValues {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string;
  body: string;
  footnotes: string;
  series: string;
  seriesPart: string;
  seriesPartLabel: string;
  /** Alt text for the optional cover image (the file itself can't be made sticky). */
  coverAlt: string;
}

export interface ComposerState {
  formError?: string;
  fieldErrors?: Record<string, string>;
  /** Sticky values so a failed publish never eats the author's draft (§3.3). */
  values?: ComposerValues;
}

export interface PreviewResult {
  /** Rendered draft (the real ArticleView) when the draft validates. */
  node?: ReactNode;
  formError?: string;
  fieldErrors?: Record<string, string>;
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

function readValues(fd: FormData): ComposerValues {
  return {
    title: str(fd, "title"),
    slug: str(fd, "slug"),
    excerpt: str(fd, "excerpt"),
    category: str(fd, "category"),
    tags: str(fd, "tags"),
    body: str(fd, "body"),
    footnotes: str(fd, "footnotes"),
    series: str(fd, "series"),
    seriesPart: str(fd, "seriesPart"),
    seriesPartLabel: str(fd, "seriesPartLabel"),
    coverAlt: str(fd, "coverAlt"),
  };
}

/** Pull the cover File out of the form (empty/absent → null). */
function coverFile(fd: FormData): File | null {
  const f = fd.get("cover");
  return f instanceof File ? f : null;
}

/** Author identity for the {author} URL segment — the author's public slug, so
 *  the published URL is /{authorSlug}/{slug} exactly like every existing article. */
function authorSlugOf(user: { authorSlug?: string; id: string }): string {
  return user.authorSlug ?? user.id;
}

/** Refresh every STATIC surface a post appears on after a create/edit/delete, so
 *  the change is visible immediately instead of waiting for the next build. The
 *  read path is SSG (lib/content/repo.ts), so a mutation to the stand-in store is
 *  invisible until its cached pages are revalidated. In production the CDC/read-
 *  replica pipeline (REBUILD §2) purges these; here revalidatePath stands in. */
function revalidatePostSurfaces(post: {
  author: string;
  slug: string;
  categories: string[];
  tags: string[];
}): void {
  revalidatePath("/"); // home index listing
  revalidatePath(`/${post.author}/${post.slug}`); // the article itself
  revalidatePath(`/author/${post.author}`); // author archive
  for (const c of post.categories) revalidatePath(`/category/${c}`);
  for (const t of post.tags) revalidatePath(`/tag/${t}`);
}

export async function previewDraft(formData: FormData): Promise<PreviewResult> {
  const user = await getSessionUser();
  if (!user || user.role !== "author") {
    return { formError: "প্রিভিউ দেখতে লেখক-অ্যাকাউন্টে প্রবেশ করুন।" };
  }
  const values = readValues(formData);
  const input = { ...values, author: authorSlugOf(user) };
  const fieldErrors = validateDraft(input);

  // Decode (but don't persist) the cover so the preview shows the real image.
  const decoded = await decodeImageUpload(coverFile(formData));
  if (isUploadError(decoded)) fieldErrors.cover = decoded.error;
  else if (decoded && !values.coverAlt.trim())
    fieldErrors.coverAlt = "ছবির জন্য বিকল্প-টেক্সট (alt) লিখুন — স্ক্রিন-রিডারে এটাই পড়া হয়।";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const cover =
    decoded && !isUploadError(decoded)
      ? inlineUpload(decoded, values.coverAlt.trim())
      : undefined;

  const draft = buildDraftPost(input, {
    id: "draft-preview",
    date: new Date().toISOString(),
    cover,
  });
  // Returned as an RSC node and rendered by the client — the same server
  // ArticleView, not a client re-implementation.
  return { node: <ArticlePreview post={draft} /> };
}

export async function publishDraft(
  _prev: ComposerState,
  formData: FormData,
): Promise<ComposerState> {
  const user = await getSessionUser();
  if (!user || user.role !== "author") {
    return { formError: "প্রকাশ করতে লেখক-অ্যাকাউন্টে প্রবেশ করুন।" };
  }
  const values = readValues(formData);
  const author = authorSlugOf(user);
  const input = { ...values, author };

  const fieldErrors = validateDraft(input);

  // Validate the optional cover alongside the text fields so the author sees every
  // problem at once, not one reload at a time.
  const decoded = await decodeImageUpload(coverFile(formData));
  if (isUploadError(decoded)) fieldErrors.cover = decoded.error;
  else if (decoded && !values.coverAlt.trim())
    fieldErrors.coverAlt = "ছবির জন্য বিকল্প-টেক্সট (alt) লিখুন — স্ক্রিন-রিডারে এটাই পড়া হয়।";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  // Never clobber an existing URL (REBUILD §3A: URLs are load-bearing). A slug
  // already taken under this author is a per-field error, not an overwrite.
  if (getPost(author, input.slug.trim())) {
    return {
      fieldErrors: { slug: "এই স্লাগে আপনার একটি লেখা আগে থেকেই আছে — অন্য স্লাগ দিন।" },
      values,
    };
  }

  const id = nextPostId();
  // Persist the cover under the new post id so its URL is stable and collision-free.
  const cover =
    decoded && !isUploadError(decoded)
      ? await persistUpload(decoded, values.coverAlt.trim(), id)
      : undefined;

  const post = buildDraftPost(input, { id, date: new Date().toISOString(), cover });
  addPost(post);
  // Make the new post show up on the cached listings, then send the author to its
  // live URL (which renders through the same ArticleView, Journey D).
  revalidatePostSurfaces(post);
  redirect(postHref(post));
}

/** True iff this author owns this post — the single ownership rule reused by
 *  edit, delete and the owner-controls probe. Compares the post's {author}
 *  segment to the session author's slug (same derivation publishDraft used). */
function ownsPost(
  user: { authorSlug?: string; id: string; role: string },
  post: { author: string },
): boolean {
  return user.role === "author" && authorSlugOf(user) === post.author;
}

/**
 * Save edits to an existing post (Journey D "edit"). Same validation + cover
 * pipeline as publish, but keyed by the hidden `editId`: it preserves the
 * immutable id and original publish date, re-verifies ownership server-side, and
 * only bumps `updated` (dateModified). Slug may change; a collision is allowed
 * only when it's the post's own slug.
 */
export async function updateDraft(
  _prev: ComposerState,
  formData: FormData,
): Promise<ComposerState> {
  const user = await getSessionUser();
  if (!user || user.role !== "author") {
    return { formError: "সম্পাদনা করতে লেখক-অ্যাকাউন্টে প্রবেশ করুন।" };
  }
  const editId = str(formData, "editId");
  const existing = getPostById(editId);
  if (!existing) return { formError: "লেখাটি খুঁজে পাওয়া গেল না।" };
  if (!ownsPost(user, existing)) {
    return { formError: "এই লেখাটি সম্পাদনার অনুমতি আপনার নেই।" };
  }

  const values = readValues(formData);
  const input = { ...values, author: existing.author };
  const fieldErrors = validateDraft(input);

  const decoded = await decodeImageUpload(coverFile(formData));
  if (isUploadError(decoded)) fieldErrors.cover = decoded.error;
  else if (decoded && !values.coverAlt.trim())
    fieldErrors.coverAlt = "ছবির জন্য বিকল্প-টেক্সট (alt) লিখুন — স্ক্রিন-রিডারে এটাই পড়া হয়।";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  // A slug clash is fine only if it's THIS post keeping its own slug.
  const clash = getPost(existing.author, input.slug.trim());
  if (clash && clash.id !== existing.id) {
    return {
      fieldErrors: { slug: "এই স্লাগে আপনার আরেকটি লেখা আছে — অন্য স্লাগ দিন।" },
      values,
    };
  }

  // Cover resolution: a new upload replaces it; otherwise keep the old cover but
  // let the author re-word its alt text without re-uploading.
  let cover = existing.cover;
  if (decoded && !isUploadError(decoded)) {
    cover = await persistUpload(decoded, values.coverAlt.trim(), existing.id);
  } else if (existing.cover && values.coverAlt.trim()) {
    cover = { ...existing.cover, alt: values.coverAlt.trim() };
  }

  const updated = buildDraftPost(input, { id: existing.id, date: existing.date, cover });
  updated.updated = new Date().toISOString(); // dateModified moves; datePublished doesn't
  updatePost(updated);

  // Refresh the article + listings so the edit is visible; if the slug changed,
  // the OLD article path must be revalidated too or it keeps serving stale HTML.
  revalidatePostSurfaces(updated);
  if (existing.slug !== updated.slug) revalidatePath(postHref(existing));
  redirect(postHref(updated));
}

export interface DeleteResult {
  ok: boolean;
  error?: string;
  /** Where the island should send the reader after a successful delete (the now-
   *  removed article URL would 404). */
  redirectTo?: string;
}

/** Delete a post the caller owns (Journey D "delete"). Session + ownership are
 *  re-verified here — the client only decided whether to SHOW the button. */
export async function deletePostAction(postId: string): Promise<DeleteResult> {
  const user = await getSessionUser();
  if (!user || user.role !== "author") {
    return { ok: false, error: "মোছার অনুমতি নেই — প্রবেশ করুন।" };
  }
  const post = getPostById(postId);
  if (!post) return { ok: false, error: "লেখাটি খুঁজে পাওয়া গেল না।" };
  if (!ownsPost(user, post)) {
    return { ok: false, error: "এই লেখাটি মোছার অনুমতি আপনার নেই।" };
  }
  deletePost(postId);
  // Purge the article (so it 404s) and drop it from the cached listings.
  revalidatePostSurfaces(post);
  return { ok: true, redirectTo: `/author/${post.author}` };
}

export interface OwnershipState {
  /** Whether to render the edit/delete controls at all. */
  canManage: boolean;
}

/** Post-mount probe for the owner-controls island, so the article page itself
 *  stays static (same split as getBookmarkState). Returns canManage=false for
 *  everyone but the post's author. */
export async function getPostOwnership(postId: string): Promise<OwnershipState> {
  const user = await getSessionUser();
  if (!user) return { canManage: false };
  const post = getPostById(postId);
  if (!post) return { canManage: false };
  return { canManage: ownsPost(user, post) };
}
