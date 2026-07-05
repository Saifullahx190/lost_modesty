import type { JsonLd as JsonLdObject } from "@/lib/seo";
import { ldJson } from "@/lib/seo";

// Embeds a JSON-LD object as <script type="application/ld+json"> (REBUILD §3C
// structured data). Serialization (with `<` escaped) lives in lib/seo so the
// shadow-diff has one auditable source for structured data.
export function JsonLd({ data }: { data: JsonLdObject }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: ldJson(data) }}
    />
  );
}
