"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { parseTerms } from "@/lib/content/draft.mjs";

export interface TermOption {
  slug: string;
  name: string;
}

interface TermPickerProps {
  /** Group label (e.g. "ট্যাগ" / "বিভাগ"). */
  label: string;
  /** Hidden-input name the server action reads — "tags" or "category". */
  name: string;
  /** Known terms to offer as one-tap chips (Bengali name shown, slug submitted). */
  options: TermOption[];
  /** Comma-separated slugs to preselect (sticky value after a failed submit, or
   *  the edit prefill). */
  defaultValue?: string;
  /** Field error surfaced by the composer (validateDraft). */
  error?: string;
  /** Helper text under the picker. */
  hint?: string;
  /** Label for the free-text "add a term not in the list" input. */
  addLabel?: string;
  addPlaceholder?: string;
}

// Tag/category selector for the composer (FRONTEND §2.4 editor). Replaces the raw
// comma-separated slug field with tappable chips drawn from the site's real term
// list (lib/content/repo getAllTags/getAllCategories), so an author picks subjects
// instead of remembering slugs. It stays a drop-in for the old text input: the
// selection is mirrored into ONE hidden <input name={name}> as a comma-joined slug
// string — exactly what readValues → parseTerms already consumes — so the publish/
// edit action, validation and the round-trip tests are untouched.
//
// An author can still add a term that isn't in the list (a fresh slug) via the
// "add" field; those become removable chips too. Selection is client state, so it
// survives a failed submit (the component stays mounted) without server round-trips.
export function TermPicker({
  label,
  name,
  options,
  defaultValue = "",
  error,
  hint,
  addLabel,
  addPlaceholder,
}: TermPickerProps) {
  const errorId = useId();
  const hintId = useId();
  const optionSlugs = useMemo(() => new Set(options.map((o) => o.slug)), [options]);

  // Preselected slugs from the sticky/edit value; client state is the source of
  // truth from here on (initializer runs once, so a re-render never resets it).
  const [selected, setSelected] = useState<string[]>(() => parseTerms(defaultValue));
  const [draft, setDraft] = useState("");

  const selectedSet = new Set(selected);
  // Selected slugs with no matching known option — author-added terms. Shown as
  // removable chips so a typo can be undone.
  const customSlugs = selected.filter((s) => !optionSlugs.has(s));

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function commitDraft() {
    const added = parseTerms(draft); // slugifies + de-dupes, same rule as the server
    if (added.length) {
      setSelected((prev) => [...prev, ...added.filter((s) => !prev.includes(s))]);
    }
    setDraft("");
  }

  function onDraftKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); // Enter must not submit the whole form; comma is a separator
      commitDraft();
    }
  }

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <fieldset className="flex flex-col gap-2">
      {/* Mirrors the current selection for the server action — comma-joined slugs. */}
      <input type="hidden" name={name} value={selected.join(", ")} />

      <legend className="text-meta text-muted">{label}</legend>

      <div className="flex flex-wrap gap-2" aria-describedby={describedBy || undefined}>
        {options.map((opt) => {
          const on = selectedSet.has(opt.slug);
          return (
            <button
              key={opt.slug}
              type="button"
              onClick={() => toggle(opt.slug)}
              aria-pressed={on}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-meta transition-colors ${
                on
                  ? "border-accent-secondary bg-bg-subtle text-text"
                  : "border-border text-muted hover:border-accent-secondary hover:text-text"
              }`}
            >
              <span
                aria-hidden="true"
                className={on ? "text-accent-secondary" : "text-muted"}
              >
                {on ? "✓" : "+"}
              </span>
              {opt.name}
            </button>
          );
        })}

        {/* Author-added terms not in the known list — removable. */}
        {customSlugs.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => toggle(slug)}
            aria-pressed
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-secondary bg-bg-subtle px-3 py-1.5 text-meta text-text transition-colors"
          >
            {slug}
            <span aria-hidden="true" className="text-muted">
              ✕
            </span>
            <span className="sr-only">(সরান)</span>
          </button>
        ))}
      </div>

      {/* Escape hatch: add a term that isn't in the list yet (a fresh slug). */}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onDraftKeyDown}
          onBlur={commitDraft}
          placeholder={addPlaceholder}
          aria-label={addLabel ?? `${label} — নতুন যোগ করুন`}
          inputMode="url"
          className="min-w-0 flex-1 rounded-md border border-border bg-bg px-3 py-2 text-body text-text placeholder:text-muted focus:border-accent-secondary focus:outline-none"
        />
        <button
          type="button"
          onClick={commitDraft}
          className="shrink-0 rounded-md border border-border px-3 py-2 text-meta text-muted transition-colors hover:border-accent-secondary hover:text-text"
        >
          যোগ করুন
        </button>
      </div>

      {hint && (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="text-caption text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
