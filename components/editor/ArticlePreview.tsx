import type { Post } from "@/lib/content/types";
import { ArticleView } from "@/components/ArticleView";

// Editor preview frame (FRONTEND §3.2 Journey D: "preview must visually match the
// live article template exactly"). It adds only a labelled frame around the SHARED
// ArticleView — the very component the live route renders — so what the author sees
// here is what publishes, with no separate preview renderer to drift (REBUILD §6.2 /
// Checkpoint 5). Rendered on the server and returned from the previewDraft action.
export function ArticlePreview({ post }: { post: Post }) {
  return (
    <section aria-label="প্রিভিউ" className="mt-10">
      <p className="mb-3 rounded-md border border-border bg-bg-subtle px-3 py-2 text-caption text-muted">
        প্রিভিউ — প্রকাশিত হলে লেখাটি ঠিক এভাবেই দেখা যাবে।
      </p>
      <div className="mx-auto max-w-article rounded-lg border border-border px-4 py-6 sm:px-6">
        <ArticleView post={post} />
      </div>
    </section>
  );
}
