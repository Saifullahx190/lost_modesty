import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// "আমাদের কাজ" nav destination — static "what we do" page. Stub copy for now;
// replace with the real portfolio/initiatives content. On the design system
// (SimplePage) so it matches the rest of the site.

const TITLE = "আমাদের কাজ";
const LEDE = "লেখা প্রকাশের বাইরে আমরা যা কিছু করি — সম্পাদনা, ধারাবাহিক আর ছোট উদ্যোগ।";

export function generateMetadata(): Metadata {
  return pageMetadata({ title: `${TITLE} — ${SITE.name}`, description: LEDE, path: "/our-work" });
}

export default function OurWorkPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: SITE.name, path: "/" },
          { name: TITLE, path: "/our-work" },
        ])}
      />
      <SimplePage title={TITLE} lede={LEDE}>
        <p>
          আমরা নতুন লেখকদের সাথে বসি, লেখা সম্পাদনা করি, আর ধারাবাহিক গল্পগুলোকে
          পর্ব ধরে ধরে সাজিয়ে দিই — যেন পড়ার সুতোটা কোথাও ছিঁড়ে না যায়।
        </p>
        <p>
          এই পাতাটি শিগগিরই আমাদের চলমান উদ্যোগ আর প্রকল্পের বিস্তারিত নিয়ে
          সাজানো হবে।
        </p>
      </SimplePage>
    </>
  );
}
