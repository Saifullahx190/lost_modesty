"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import {
  publishDraft,
  updateDraft,
  previewDraft,
  type ComposerState,
  type ComposerValues,
} from "@/lib/content/actions";

interface ComposerFormProps {
  /** "create" publishes a new post; "edit" saves an existing one by `editId`. */
  mode?: "create" | "edit";
  /** Immutable id of the post being edited (edit mode only). */
  editId?: string;
  /** Prefill values when editing (from postToComposerValues). */
  initial?: Partial<ComposerValues>;
  /** Existing cover src to preview until/unless a new file is chosen. */
  coverSrc?: string;
}

// Author composer (FRONTEND §2.4 editor / §3.2 Journey D). One <form>, two modes:
//  • create → "প্রকাশ করুন" runs publishDraft (append + redirect to live URL).
//  • edit   → "সংরক্ষণ করুন" runs updateDraft (save in place, keyed by editId).
//  • "প্রিভিউ দেখুন" (both modes) calls previewDraft imperatively with the current
//    form data and renders the RETURNED server node — the real ArticleView (§6.2).
// Degrades without JS: submit still works as a plain form POST; only the live
// preview (an enhancement) needs JS. Fields are uncontrolled with defaultValue so
// a failed submit keeps the author's draft intact (§3.3), no controlled-input churn.
export function ComposerForm({ mode = "create", editId, initial, coverSrc }: ComposerFormProps) {
  const editing = mode === "edit";
  const [pubState, publishAction, publishing] = useActionState<ComposerState, FormData>(
    editing ? updateDraft : publishDraft,
    {},
  );

  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<ReactNode>(null);
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
  const [previewFormError, setPreviewFormError] = useState<string>("");
  const [previewing, startPreview] = useTransition();

  // Local object-URL thumbnail for the chosen cover — a "you'll get this image"
  // confirmation before publish, with no upload round-trip. Revoked when it changes
  // or the composer unmounts so the blob isn't leaked.
  const [coverUrl, setCoverUrl] = useState<string>("");
  useEffect(() => () => { if (coverUrl) URL.revokeObjectURL(coverUrl); }, [coverUrl]);

  function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setCoverUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : "";
    });
  }

  function onPreview() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startPreview(async () => {
      const res = await previewDraft(fd);
      setPreviewErrors(res.fieldErrors ?? {});
      setPreviewFormError(res.formError ?? "");
      setPreview(res.node ?? null); // cleared when validation fails
    });
  }

  // A field shows the freshest error from either path (publish or preview).
  const err = (k: keyof ComposerValues) => pubState.fieldErrors?.[k] ?? previewErrors[k];
  // Sticky server value (after a failed submit) wins; else the edit prefill; else empty.
  const val = (k: keyof ComposerValues) => pubState.values?.[k] ?? initial?.[k] ?? "";
  const formError = pubState.formError || previewFormError;
  // The cover file isn't a ComposerValues field, so its error is read directly.
  const coverErr = pubState.fieldErrors?.cover ?? previewErrors.cover;

  return (
    <div className="flex flex-col gap-8">
      <form ref={formRef} action={publishAction} className="flex flex-col gap-2" noValidate>
        {/* Carries the immutable post id through to updateDraft (edit mode only). */}
        {editing && editId && <input type="hidden" name="editId" value={editId} />}

        <p role="alert" aria-live="polite" className="min-h-[1.25rem] text-meta text-danger">
          {formError}
        </p>

        <Input label="শিরোনাম" name="title" required defaultValue={val("title")} error={err("title")} />
        <Input
          label="ইউআরএল স্লাগ"
          name="slug"
          required
          inputMode="url"
          placeholder="raat-baarotar-por"
          defaultValue={val("slug")}
          error={err("slug")}
        />
        <Input
          label="সংক্ষিপ্ত বিবরণ (সার্চ ও শেয়ারে দেখা যাবে)"
          name="excerpt"
          required
          defaultValue={val("excerpt")}
          error={err("excerpt")}
        />

        {/* Cover image (ঐচ্ছিক) — an author-uploaded hero shown atop the article and on
            its card. Optional; when present, alt text is required so it stays accessible
            (FRONTEND §1.3). Degrades on no-JS: the file still POSTs with the form, only
            the thumbnail below needs JS. */}
        <div className="flex flex-col gap-2 rounded-md border border-border px-3 py-3">
          <span className="text-meta text-muted">প্রচ্ছদ ছবি (ঐচ্ছিক)</span>
          <input
            type="file"
            name="cover"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            onChange={onCoverChange}
            aria-invalid={coverErr ? true : undefined}
            className="text-body text-text file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-bg-subtle file:px-3 file:py-2 file:text-meta file:text-text hover:file:bg-bg"
          />
          {editing && coverSrc && (
            <p className="text-caption text-muted">
              নতুন ছবি না দিলে বর্তমান প্রচ্ছদটিই থাকবে।
            </p>
          )}
          {coverErr && (
            <p role="alert" aria-live="polite" className="text-caption text-danger">
              {coverErr}
            </p>
          )}
          {(coverUrl || coverSrc) && (
            /* A newly-chosen file (blob) wins; otherwise the post's existing cover in
               edit mode. Plain <img>, not the optimized next/image render (the live
               preview panel below shows that). */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl || coverSrc}
              alt=""
              className="mt-1 aspect-cover w-full max-w-sm rounded-md border border-border object-cover"
            />
          )}
          <Input
            label="ছবির বিকল্প-টেক্সট (alt)"
            name="coverAlt"
            placeholder="ছবিতে কী দেখা যাচ্ছে, সংক্ষেপে"
            defaultValue={val("coverAlt")}
            error={err("coverAlt")}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            label="বিভাগ (কমা দিয়ে)"
            name="category"
            placeholder="golpo, dhara"
            defaultValue={val("category")}
            error={err("category")}
          />
          <Input
            label="ট্যাগ (কমা দিয়ে)"
            name="tags"
            placeholder="raat, smriti"
            defaultValue={val("tags")}
            error={err("tags")}
          />
        </div>

        <Textarea
          label="মূল লেখা"
          name="body"
          rows={14}
          defaultValue={val("body")}
          error={err("body")}
          hint="## দিয়ে উপশিরোনাম, > দিয়ে উদ্ধৃতি, ফাঁকা লাইন দিয়ে নতুন অনুচ্ছেদ। পাদটীকার জন্য লেখায় [^1] লিখুন।"
        />

        <Textarea
          label="পাদটীকা (এক লাইনে একটি করে — ঐচ্ছিক)"
          name="footnotes"
          rows={3}
          defaultValue={val("footnotes")}
        />

        <details className="rounded-md border border-border px-3 py-2">
          <summary className="cursor-pointer text-meta text-muted">ধারাবাহিক (ঐচ্ছিক)</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Input label="সিরিজ স্লাগ" name="series" placeholder="haariye-jawa-shohor" defaultValue={val("series")} />
            <Input label="পর্ব নম্বর" name="seriesPart" inputMode="numeric" placeholder="2" defaultValue={val("seriesPart")} />
            <Input label="পর্বের লেবেল" name="seriesPartLabel" placeholder="পর্ব ২" defaultValue={val("seriesPartLabel")} />
          </div>
        </details>

        <div className="mt-2 flex flex-wrap gap-3">
          <Button type="button" onClick={onPreview} loading={previewing} loadingLabel="প্রিভিউ তৈরি হচ্ছে…">
            প্রিভিউ দেখুন
          </Button>
          <Button
            type="submit"
            loading={publishing}
            loadingLabel={editing ? "সংরক্ষণ করা হচ্ছে…" : "প্রকাশ করা হচ্ছে…"}
          >
            {editing ? "সংরক্ষণ করুন" : "প্রকাশ করুন"}
          </Button>
        </div>
      </form>

      {preview}
    </div>
  );
}
