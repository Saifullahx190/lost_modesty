import Link from "next/link";
import { termName } from "@/lib/content/repo";

// Tag / category labels (FRONTEND §2.4): "plain colored text links inline … do not
// over-design into heavy pill/badge shapes". Color = --color-accent-secondary
// (terracotta), the contrast-verified label token (colors.json), NOT marigold.
export function TagList({
  kind,
  slugs,
  className = "",
}: {
  kind: "category" | "tag";
  slugs: string[];
  className?: string;
}) {
  if (slugs.length === 0) return null;
  const base = kind === "category" ? "/category" : "/tag";
  return (
    <ul className={`flex flex-wrap gap-x-3 gap-y-1 ${className}`.trim()}>
      {slugs.map((slug) => (
        <li key={slug}>
          <Link
            href={`${base}/${slug}`}
            className="text-meta text-accent-secondary underline-offset-2 hover:underline"
          >
            {termName(kind, slug)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
