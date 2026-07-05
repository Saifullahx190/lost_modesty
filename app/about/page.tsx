import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// "আমাদের সম্পর্কে" nav destination — static about page. Stub copy for now; the
// editorial team fills the real story. Kept on the design system (SimplePage)
// so it never reads as a placeholder route.

const TITLE = "আমাদের সম্পর্কে";
const LEDE = `${SITE.name} — বাংলা সাহিত্য ব্লগ। গদ্য, ধারাবাহিক গল্প আর প্রবন্ধের একটা ছোট ঘর।`;

export function generateMetadata(): Metadata {
  return pageMetadata({ title: `${TITLE} — ${SITE.name}`, description: LEDE, path: "/about" });
}

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: SITE.name, path: "/" },
          { name: TITLE, path: "/about" },
        ])}
      />
      <SimplePage title={TITLE} lede={LEDE}>
        <p>
          আমরা এমন লেখা খুঁজি যা তাড়াহুড়ো করে না — যে গল্প রাত জাগে, যে প্রবন্ধ
          একটু থেমে ভাবতে বলে। {SITE.name}-তে আমরা সেই লেখাগুলোকে একসাথে রাখি,
          যত্ন করে।
        </p>
        <p>
          এখানে পাঠক আর লেখক দুজনেই ঘরের মানুষ। তুমি চাইলে পড়তে পারো, চাইলে নিজের
          লেখাও রাখতে পারো — দরজা খোলা।
        </p>
      </SimplePage>
    </>
  );
}
