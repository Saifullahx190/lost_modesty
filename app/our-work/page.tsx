import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { T } from "@/components/T";
import { TextLink } from "@/components/TextLink";

// "আমাদের কাজ" nav destination — the team's mission line plus its official
// disclaimer (লস্ট মডেস্টি টিমের অফিশিয়াল ডিসক্লেইমার). On the design system
// (SimplePage) so it matches the rest of the site. The disclaimer body is
// long-form Bengali CONTENT, so it renders as raw prose — untranslated, matching
// how the About story and blog article bodies work; only chrome (headings) sits
// on the T toggle. No visible lede — LEDE is kept only as the SEO metadata description.

const TITLE = "আমাদের কাজ";
const LEDE =
  "আমরা লস্ট মডেস্টি টিম, কাজ করছি অশ্লীলতা আর নোংরামির বিরুদ্ধে। আমাদের প্রত্যাশা সেদিনের, যেদিন আমাদের ভাই আর বোনগুলো হবে কলঙ্কমুক্ত, নিষ্পাপ।";

// অফিশিয়াল প্ল্যাটফর্মসমূহ (দাবিত্যাগ, ধারা ৩) — label + visible URL as the team
// lists them + the real href. All external, so each opens in a new tab.
const OFFICIAL_PLATFORMS: { label: string; href: string; text: string }[] = [
  { label: "ওয়েবসাইট", href: "https://www.lostmodesty.com", text: "www.lostmodesty.com" },
  { label: "ইউটিউব চ্যানেল", href: "https://www.youtube.com/lostmodesty", text: "youtube.com/lostmodesty" },
  { label: "ফেসবুক পেইজ", href: "https://www.fb.com/lostmodesty", text: "fb.com/lostmodesty" },
  { label: "ইনস্টাগ্রাম", href: "https://www.instagram.com/lostmodesty", text: "instagram.com/lostmodesty" },
  { label: "টেলিগ্রাম", href: "https://t.me/lostmodesty", text: "t.me/lostmodesty" },
  { label: "অ্যাপ", href: "https://tinyurl.com/mry9n44t", text: "tinyurl.com/mry9n44t" },
];

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
      <SimplePage title={<T bn={TITLE} en="Our Work" />}>
        <p>
          <T
            bn="আমরা লস্ট মডেস্টি টিম, কাজ করছি অশ্লীলতা আর নোংরামির বিরুদ্ধে। আমাদের প্রত্যাশা সেদিনের, যেদিন আমাদের ভাই আর বোনগুলো হবে কলঙ্কমুক্ত, নিষ্পাপ।"
            en="We are the Lost Modesty team, working against obscenity and filth. We long for the day when our brothers and sisters will be untainted and pure."
          />
        </p>

        <hr className="my-4 border-border" />

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-h2 text-text">
            <T bn="লস্ট মডেস্টি টিমের অফিশিয়াল ডিসক্লেইমার" en="Lost Modesty — Official Disclaimer" />
          </h2>

          <ol className="list-[bengali] space-y-4 ps-6 marker:text-muted">
            <li>
              লস্ট মডেস্টি ব্লগ সম্পূর্ণ অরাজনৈতিক ও অলাভজনক একটি উদ্যোগ। এটি কোনো দল, গোষ্ঠী বা
              সংগঠনের সঙ্গে যুক্ত নয়। লস্ট মডেস্টি আমাদের সমাজে ছড়িয়ে পড়া অশ্লীলতা, বিশেষ করে
              পর্নোগ্রাফির ভয়াবহতা সম্পর্কে সচেতনতা সৃষ্টির একটি অনলাইন প্ল্যাটফর্ম/ব্লগ। লস্ট
              মডেস্টি কোনো নির্দিষ্ট দল, গোষ্ঠী বা সংগঠনকে নয়, বরং একমাত্র আল্লাহকে সন্তুষ্ট করার
              উদ্দেশ্যেই সকল কার্যক্রম পরিচালনা করে।
            </li>
            <li>লস্ট মডেস্টির সকল কার্যক্রম অনলাইনেই সীমাবদ্ধ।</li>
            <li>
              লস্ট মডেস্টির অফিশিয়াল ব্লগ, ফেসবুক পেইজ, ইনস্টাগ্রাম পেইজ ও ইউটিউব চ্যানেল ছাড়া এর
              আর কোনো অনলাইন প্ল্যাটফর্ম (গ্রুপ, আইডি, ব্লগ, সাইট, প্রোফাইল ইত্যাদি) নেই। এই
              অফিশিয়াল প্ল্যাটফর্মগুলোর বাইরে অন্য কোনো অনলাইন প্ল্যাটফর্মের বক্তব্য বা কর্মকাণ্ডের
              দায় থেকে লস্ট মডেস্টি সম্পূর্ণ মুক্ত।
              <p className="mt-3 text-muted">আমাদের অফিশিয়াল প্ল্যাটফর্মসমূহ:</p>
              <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
                {OFFICIAL_PLATFORMS.map(({ label, href, text }) => (
                  <div key={href} className="contents">
                    <dt className="text-muted">{label}</dt>
                    <dd className="min-w-0 break-words">
                      <TextLink
                        href={href}
                        emphasis="accent"
                        lang="en"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {text}
                      </TextLink>
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
            <li>
              আমাদের অফিশিয়াল পেইজ, ব্লগ, বই ও অফিশিয়াল লিফলেটে প্রকাশিত নিজস্ব কনটেন্টের
              (আর্টিকেল, ছবি, ভিডিও, অডিও, স্লাইড) প্রতি আমরা সম্পূর্ণ দায়বদ্ধ। এর বাইরে কেউ আমাদের
              নাম ব্যবহার করে ভিন্ন কোনো কনটেন্ট প্রকাশ বা প্রচার করলে আমরা তার দায়ভার নেব না।
            </li>
            <li>লস্ট মডেস্টির সকল কনটেন্ট উন্মুক্ত। যে কেউ এগুলো অনলাইন থেকে ডাউনলোড করতে পারেন।</li>
            <li>
              কিছু প্রতিবন্ধকতার কারণে আমাদের কাজের ক্ষেত্র অনলাইনেই সীমাবদ্ধ। তবে যেকোনো ব্যক্তি বা
              সংগঠন চাইলে কোনোরূপ পরিবর্তন-পরিবর্ধন (manipulation) ছাড়া আমাদের কনটেন্ট ব্যবহার করে
              মাঠপর্যায়ে অশ্লীলতার বিরুদ্ধে আলোচনাকেন্দ্রিক প্রোগ্রাম আয়োজন করতে পারেন। এক্ষেত্রে
              তাঁদের কার্যক্রমের যাবতীয় দায়ভার কেবল তাঁদের ওপরই বর্তাবে; আমাদের পক্ষে সশরীরে উপস্থিত
              থেকে সেসব কাজ মনিটর করার সামর্থ্য নেই।
            </li>
            <li>
              বিভিন্ন এলাকায় কিছু ভাই সম্পূর্ণ নিজ উদ্যোগে আমাদের কনটেন্ট ব্যবহার করে পর্নোগ্রাফির
              বিরুদ্ধে সচেতনতামূলক সেমিনার বা ক্যাম্পেইন করছেন। এক্ষেত্রে তাঁরা "লস্ট মডেস্টি সাপোর্ট
              (সমর্থক) টিম" নাম ব্যবহার করলেও বস্তুত তাঁরা সম্পূর্ণ স্ব-উদ্যোগে, নিজস্ব অর্থায়নে এ
              কাজগুলো চালিয়ে যাচ্ছেন। তাঁরা আমাদের কোনো অঙ্গসংগঠন নন; তাঁদের কাজের দায়ভার থেকে আমরা
              মুক্ত। আল্লাহ তাঁদের উত্তম প্রতিদান দিন।
            </li>
            <li>
              কেবল লস্ট মডেস্টির অফিশিয়াল ফেসবুক পেইজ, ব্লগ ও ইউটিউব চ্যানেলে প্রকাশিত বক্তব্যই লস্ট
              মডেস্টির নিজস্ব ও অফিশিয়াল বক্তব্য হিসেবে গণ্য হবে। অন্য কোনো বক্তব্য বা কর্মকাণ্ডের দায়
              লস্ট মডেস্টি গ্রহণ করবে না।
            </li>
            <li>
              কোনো ধরনের মানসিক বা শারীরিক হয়রানি, চাঁদাবাজি, ফ্রি-মিক্সিং, অশ্লীলতা, প্রতারণা, কপটতা
              বা অপরাধকে আমরা সমর্থন বা প্রচার করি না। তাই 'Lost Modesty' / 'মুক্ত বাতাসের খোঁজে' বা
              অনুরূপ কোনো নাম কিংবা আমাদের কনটেন্ট ব্যবহার করে কেউ হয়রানি, চাঁদাবাজি, প্রতারণা বা
              কোনো অপকর্ম করার চেষ্টা করলে সেই অপরাধের দায়ভার কেবল তাদেরই।
            </li>
            <li>
              লস্ট মডেস্টি টিম কোনো ব্যক্তি বা সংগঠনের কাছ থেকে অর্থ সংগ্রহ করে না, কাউকে অর্থ
              প্রদানও করে না।
            </li>
            <li>
              আমরা মুসলিম। আমাদের কনটেন্টে কুরআন, সুন্নাহ, সীরাহ — সর্বোপরি ইসলামের কথা প্রত্যক্ষ বা
              পরোক্ষভাবে আসে এবং আসবে, ইন শা আল্লাহ। এক্ষেত্রে আমরা সর্বদা অথেনটিক সোর্স থেকে
              রেফারেন্স নেওয়ার চেষ্টা করি। আমাদের কোনো কনটেন্ট নিয়ে উদ্দেশ্যমূলক মিথ্যা রটনা বা
              বিতর্কিত মন্তব্য কাম্য নয়। এছাড়া আমাদের কোনো কনটেন্টের সঙ্গে কোনো নির্দিষ্ট ব্যক্তি বা
              দলের মিল খুঁজে পাওয়া গেলে তা একান্তই কাকতালীয়; আমরা এর দায়ভার নেব না।
            </li>
          </ol>
        </section>
      </SimplePage>
    </>
  );
}
