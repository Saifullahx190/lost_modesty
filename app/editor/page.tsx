import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getPostById } from "@/lib/content/repo";
import { postToComposerValues } from "@/lib/content/draft.mjs";
import { pageMetadata } from "@/lib/seo";
import { ComposerForm } from "@/components/editor/ComposerForm";

// Article composer (REBUILD §4 Phase 5 #7 / FRONTEND §3.1 #8). Author-facing, SSR
// + noindex (REBUILD §1#7: editor is not indexed). Its output round-trips into the
// Phase-1 renderer via the shared ArticleView (Checkpoint 5). Staged behind the
// strangler-fig: the `editor` route class stays at canaryPercent 0 (→ OLD) until
// its Phase-5 checkpoint.
export const metadata: Metadata = pageMetadata({
  title: "নতুন লেখা",
  description: "নতুন লেখা লিখুন ও প্রকাশ করুন।",
  path: "/editor",
  noindex: true,
});

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const user = await getSessionUser();
  // Logged-out → login with a return path (§3.4).
  if (!user) redirect("/login?next=/editor");
  // Readers can't author — the panel is author-facing (REBUILD §1#7). Bounce to
  // their dashboard rather than showing a form that would fail on publish.
  if (user.role !== "author") redirect("/dashboard");
  const authorSlug = user.authorSlug ?? user.id;

  // Edit mode: /editor?id=<postId>. Load + ownership-check server-side; a missing
  // or not-owned id silently falls back to a fresh composer rather than erroring.
  const sp = await searchParams;
  const editId = typeof sp.id === "string" ? sp.id : undefined;
  const editPost = editId ? getPostById(editId) : undefined;
  const editing = !!editPost && editPost.author === authorSlug;
  const initial = editing ? postToComposerValues(editPost!) : undefined;

  return (
    <div className="mx-auto max-w-index px-4 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-meta text-muted">লেখক · {user.name}</p>
        <h1 className="font-display text-display text-text">
          {editing ? "লেখা সম্পাদনা" : "নতুন লেখা"}
        </h1>
      </header>
      <ComposerForm
        mode={editing ? "edit" : "create"}
        editId={editing ? editId : undefined}
        initial={initial}
        coverSrc={editing ? editPost!.cover?.src : undefined}
      />
    </div>
  );
}
