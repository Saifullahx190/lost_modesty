import type { Author, Post, Series, Term } from "./types";
import { postIdentity } from "./ids.mjs";

// ───────────────────────────────────────────────────────────────────────────
// LOCAL SAMPLE CONTENT — Phase 1 SSG source, standing in for the read-replica.
//
// In production these records come from the read-replica / content API (REBUILD
// §2 data layer). Until that contract is live (FRONTEND §6.2 working agreement),
// this hand-authored set lets the entire read path build, render, and be
// validated against the design plan with REAL Bengali content and real-length
// long-form text (FRONTEND §5.1: "real-content prototypes over Lorem Ipsum" —
// a layout that survives Lorem can still break on Bengali conjunct wrapping).
//
// IDs are stable and decoupled from slugs (REBUILD §3A immutable key). Each
// post's id/author/slug triple is spread from lib/content/ids.mjs — the shared
// identity registry the comment/bookmark checkpoint validators also read — so
// the app and the node tests can never disagree about which keys exist.
// ───────────────────────────────────────────────────────────────────────────

// Single editorial identity — every post is bylined লস্ট মডেস্টি (the team),
// never an individual writer. The reader-facing author archive lives at
// /author/lostmodesty; the author account in lib/auth/users.mjs carries the
// matching authorSlug so the dashboard/editor resolve to this same identity.
export const AUTHORS: Author[] = [
  {
    slug: "lostmodesty",
    name: "লস্ট মডেস্টি",
    bio: "অশ্লীলতা আর নোংরামির বিরুদ্ধে আমাদের সমস্ত লেখা। সব লেখাই লস্ট মডেস্টি টিমের — কোনো আলাদা লেখকের নামে নয়।",
  },
];

export const CATEGORIES: Term[] = [
  { slug: "golpo", name: "গল্প", description: "ছোটগল্প ও ধারাবাহিক আখ্যান।" },
  { slug: "probondho", name: "প্রবন্ধ", description: "চিন্তা, সমাজ ও সম্পর্ক নিয়ে গদ্য।" },
  { slug: "love", name: "প্রেম", description: "প্রেম, বিচ্ছেদ আর তার মাঝখানের ধূসর জায়গাগুলো।" },
];

export const TAGS: Term[] = [
  // Tags used by the seed posts above (kept so those posts' archives resolve).
  { slug: "poetry", name: "কবিতা" },
  { slug: "raat", name: "রাত" },
  { slug: "smriti", name: "স্মৃতি" },
  { slug: "rajniti", name: "রাজনীতি" },
  { slug: "dhara", name: "ধারাবাহিক" },
  // Subject tags carried over from the live site's "সব বিষয়" page so the composer
  // can offer them for one-tap selection (FRONTEND §2.4 editor / topics hub §3.1).
  // Display names are the Bengali subjects; slugs are URL-safe Latin (Bengali can't
  // transliterate cleanly — REBUILD §3A). Near-duplicate legacy entries (trailing-
  // dash variants, the English "BLOG") are merged into one canonical term.
  { slug: "blog", name: "ব্লগ" },
  { slug: "shobhotar-shongkot", name: "সভ্যতার সংকট" },
  { slug: "reminder", name: "রিমাইন্ডার" },
  { slug: "porn-masturbation-asokti", name: "ঝেঁটিয়ে বিদায় করুন বেয়াড়া পর্ন–মাস্টারবেশন আসক্তি" },
  { slug: "phaguner-din-shesh-hobe-ekdin", name: "ফাগুনের দিন শেষ হবে একদিন" },
  { slug: "onibarjo-joto-khoy", name: "অনিবার্য যত ক্ষয়" },
  { slug: "mithyay-bosot", name: "মিথ্যায় বসত" },
  { slug: "akasher-opare-akash", name: "আকাশের ওপারে আকাশ" },
  { slug: "bhese-phelo-ei-karagar", name: "ভেসে ফেলো এই কারাগার" },
  { slug: "bhenge-phelo-karagar", name: "ভেঙে ফেলো কারাগার" },
  { slug: "nire-pherar-golpo", name: "নীড়ে ফেরার গল্প" },
  { slug: "kurano-mukto", name: "কুড়ানো মুক্তো" },
  { slug: "nil-ronger-ondhokar", name: "নীল রঙের অন্ধকার" },
  { slug: "biye-niye-iniye-biniye", name: "বিয়ে নিয়ে ইনিয়ে বিনিয়ে" },
  { slug: "amader-santan-porbo-dekhe", name: "আমাদের সন্তান পর্ব দেখে" },
  { slug: "nil-noksha", name: "নীল নকশা" },
  { slug: "campaign", name: "ক্যাম্পেইন" },
  { slug: "tomar-chokhe-dekhechilam-amar-sarbonash", name: "তোমার চোখে দেখেছিলাম আমার সর্বনাশ" },
  { slug: "premtal", name: "প্রেমতাল" },
  { slug: "oshoni-shongket", name: "অশনি সংকেত" },
  { slug: "he-amar-meye", name: "হে আমার মেয়ে" },
  { slug: "chorabali", name: "চোরাবালি" },
  { slug: "sholo", name: "ষোলো" },
  { slug: "onupom-utthan", name: "অনুপম উত্থান" },
  { slug: "pordar-opashe", name: "পর্দার ওপাশে" },
  { slug: "nesha-jokhon-choti-golpo-pora", name: "নেশা যখন চটি গল্প পড়া" },
  { slug: "ramadan", name: "রমাদান" },
  { slug: "love-vs-arranged-marriage", name: "লাভ ম্যারেজ বনাম এরেঞ্জ ম্যারেজ" },
  { slug: "bishe-bishkhoy", name: "বিষে বিষক্ষয়" },
  { slug: "porn-myth", name: "পর্ন মিথ" },
  { slug: "amader-kotha", name: "আমাদের কথা" },
  { slug: "ekguchho-onubad", name: "একগুচ্ছ অনুবাদ" },
  { slug: "hariye-jabar-bela", name: "হারিয়ে যাবার বেলা" },
  { slug: "o-jokhon-porn-asokto", name: "ও যখন পর্ন আসক্ত" },
  { slug: "sex-education", name: "সেক্স এডুকেশন" },
  { slug: "kishor-magazine-shol", name: "কিশোর ম্যাগাজিন ষোল" },
  { slug: "fantasy-kingdom", name: "ফ্যান্টাসি কিংডম" },
  { slug: "bloge-notun", name: "ব্লগে নতুন" },
  { slug: "chotto-buke-onek-betha", name: "ছোট্ট বুকে অনেক ব্যাথা" },
  { slug: "shubhotar-byakoron", name: "শুভতার ব্যাকরণ" },
  { slug: "bhalobashar-myth", name: "ভালোবাসার মিথ" },
  { slug: "atmohotya", name: "আত্মহত্যা" },
  { slug: "atatayi-bhalobasha", name: "আততায়ী ভালোবাসা" },
];

export const SERIES: Series[] = [
  { slug: "haariye-jawa-shohor", name: "হারিয়ে যাওয়া শহর" },
];

// A long-form Bengali paragraph reused to give article bodies real reading length.
const LONG_1 =
  "শহরটা রাত বারোটার পর অন্যরকম হয়ে যায়। দিনের শব্দগুলো সরে গেলে যে নীরবতা নামে, সেটা ফাঁকা নয় — সেটা ভরা, পুরোনো কথায়, না-বলা বাক্যে। আমি জানালার ধারে বসে থাকি, আর মনে হয় শহর নিজেও কিছু মনে রাখতে চায় না, তবু পারে না ভুলতে।";
const LONG_2 =
  "তুমি একবার বলেছিলে, ভালোবাসা আসলে মনে রাখার একটা ধরন। তখন হেসেছিলাম। এখন বুঝি, ভুলে যাওয়াও ঠিক ততটাই যত্নের কাজ — কাউকে ভুলতে গেলে আগে তাকে পুরোপুরি মনে করতে হয়, তারপর একটু একটু করে ছেড়ে দিতে হয়।";

const SEED_POSTS: Post[] = [
  {
    ...postIdentity("p-1001"),
    title: "রাত বারোটার পর",
    excerpt:
      "দিনের শব্দ সরে গেলে যে নীরবতা নামে, সেটা ফাঁকা নয় — সেটা ভরা, না-বলা বাক্যে।",
    date: "2024-11-02T20:30:00+06:00",
    updated: "2024-11-05T09:00:00+06:00",
    categories: ["golpo", "love"],
    tags: ["raat", "smriti"],
    cover: {
      src: "/covers/raat.svg",
      alt: "অন্ধকার জানালার পর্দা সরিয়ে বাইরে তাকানো একটি অবয়ব।",
      width: 1600,
      height: 1000,
    },
    body: [
      { type: "paragraph", text: LONG_1 },
      {
        type: "heading",
        level: 2,
        id: "ek-shohor",
        text: "১) একটা শহর, একা",
      },
      { type: "paragraph", text: LONG_2 + " [^1]" },
      {
        type: "quote",
        text: "যা কিছু আলো, তার একটা ছায়া থাকে; যা কিছু মনে থাকে, তার একটা দাম থাকে।",
      },
      {
        type: "heading",
        level: 2,
        id: "dui-jaowa",
        text: "২) চলে যাওয়া",
      },
      { type: "paragraph", text: LONG_1 + " " + LONG_2 },
      { type: "paragraph", text: "শেষমেশ আমরা কেউই হারিয়ে যাই না; আমরা শুধু এমন কোথাও সরে যাই, যেখানে অন্যের আলো পৌঁছায় না। [^2]" },
    ],
    footnotes: [
      { n: 1, id: "fn-1", text: "বাক্যটি ধার করা — পুরোনো এক চিঠি থেকে, যার প্রেরক আজ আর নেই।" },
      { n: 2, id: "fn-2", text: "এই লেখাটি “হারিয়ে যাওয়া শহর” ধারাবাহিকের সূচনা নয়, বরং তার ছায়া।" },
    ],
  },
  {
    ...postIdentity("p-1002"),
    title: "প্রেম, রাজনীতি আর মধ্যবর্তিনী",
    excerpt:
      "প্রেম কি ব্যক্তিগত, নাকি সবসময়ই একটু রাজনৈতিক? দুইয়ের মাঝখানে দাঁড়িয়ে লেখা।",
    date: "2024-10-18T11:00:00+06:00",
    categories: ["probondho", "love"],
    tags: ["rajniti", "smriti"],
    body: [
      { type: "paragraph", text: "প্রেমকে আমরা ভাবি ব্যক্তিগত — দুটো মানুষের ভেতরের ব্যাপার। অথচ কাকে ভালোবাসা যাবে, কীভাবে, কতটা — তার অনেকটাই ঠিক করে দেয় বাইরের কাঠামো।" },
      { type: "heading", level: 2, id: "byaktigato", text: "১) ব্যক্তিগত যা, রাজনৈতিকও তা" },
      { type: "paragraph", text: LONG_2 },
      { type: "heading", level: 2, id: "modhyobortini", text: "২) মধ্যবর্তিনী" },
      { type: "paragraph", text: LONG_1 },
    ],
  },
  // ── Series: হারিয়ে যাওয়া শহর — পর্ব ১/২/শেষ পর্ব ──────────────────────────
  {
    ...postIdentity("p-1003"),
    title: "হারিয়ে যাওয়া শহর — পর্ব ১",
    excerpt: "যে শহরে আমরা বড় হয়েছি, সে শহর আর নেই। তবু রাস্তাগুলো রয়ে গেছে।",
    date: "2024-09-01T19:00:00+06:00",
    categories: ["golpo"],
    tags: ["dhara", "raat", "smriti"],
    series: { series: "haariye-jawa-shohor", part: 1, partLabel: "পর্ব ১" },
    cover: {
      src: "/covers/shohor.svg",
      alt: "কুয়াশায় ঢাকা একটি পুরোনো শহরের অলিগলি।",
      width: 1600,
      height: 1000,
    },
    body: [
      { type: "paragraph", text: LONG_1 },
      { type: "paragraph", text: "এখানেই গল্পটা শুরু — একটা চিঠি দিয়ে, যেটা কোনোদিন পাঠানো হয়নি।" },
    ],
  },
  {
    ...postIdentity("p-1004"),
    title: "হারিয়ে যাওয়া শহর — পর্ব ২",
    excerpt: "চিঠিটা পড়া হলো, অনেক দেরিতে। আর তখনই শহরটা আবার বদলে গেল।",
    date: "2024-09-15T19:00:00+06:00",
    categories: ["golpo"],
    tags: ["dhara", "raat"],
    series: { series: "haariye-jawa-shohor", part: 2, partLabel: "পর্ব ২" },
    body: [
      { type: "paragraph", text: LONG_2 },
      { type: "paragraph", text: "দ্বিতীয় পর্বে এসে মনে হয়, কিছু শহর আসলে মানুষ — তারাও আমাদের মতো হারায়।" },
    ],
  },
  {
    ...postIdentity("p-1005"),
    title: "হারিয়ে যাওয়া শহর — শেষ পর্ব",
    excerpt: "শেষে এসে বোঝা যায়, খোঁজাটাই ছিল আসল শহর। গন্তব্য নয়।",
    date: "2024-10-01T19:00:00+06:00",
    categories: ["golpo", "love"],
    tags: ["dhara", "smriti"],
    series: { series: "haariye-jawa-shohor", part: 3, partLabel: "শেষ পর্ব" },
    body: [
      { type: "paragraph", text: LONG_1 + " " + LONG_2 },
      { type: "paragraph", text: "অতঃপর তাহারা সুখে শান্তিতে বসবাস করিতে থাকিলো — এমন কোনো লাইন এই গল্পে নেই। আছে শুধু একটা খোলা জানালা।" },
    ],
  },
  // ── "আততায়ী ভালোবাসা" tag — starter post so the term resolves on /topics and
  //    /tag/atatayi-bhalobasha. Placeholder body; replace with the real writing.
  {
    ...postIdentity("p-1006"),
    title: "আততায়ী ভালোবাসা",
    excerpt:
      "যে ভালোবাসা আড়ালে ছুরি লুকিয়ে রাখে — কীভাবে চিনবে তাকে? (স্টার্টার লেখা — শিগগিরই সম্পূর্ণ হবে।)",
    date: "2026-07-07T10:00:00+06:00",
    categories: ["love"],
    tags: ["atatayi-bhalobasha"],
    body: [
      {
        type: "paragraph",
        text: "কিছু ভালোবাসা আলো হয়ে আসে, আর কিছু আসে ছদ্মবেশে — হাসিমুখে, অথচ হাতের আড়ালে লুকানো ছুরি নিয়ে। এই লেখাটি সেই আততায়ী ভালোবাসার গল্প, যে আদরের নাম করে ধীরে ধীরে নিঃশেষ করে দেয়।",
      },
      {
        type: "paragraph",
        text: "এটি এই বিষয়ের সূচনা-লেখা। সম্পূর্ণ লেখাটি শিগগিরই এখানে যুক্ত হবে, ইন শা আল্লাহ।",
      },
    ],
  },
];

// The content array is a PROCESS SINGLETON via globalThis. Next compiles server
// actions and page/RSC renders into separate module graphs, so a plain
// module-level `const POSTS` is instantiated TWICE — a post the publish action
// (action layer) appends would be invisible to the article render (RSC layer),
// which would 404 a just-published post. Pinning the array to globalThis makes
// both layers share one instance. Purely a stand-in-store concern: the real
// content store (REBUILD §2 read-replica + dual-write/CDC) is shared by
// construction, so this shim disappears with it.
const g = globalThis as typeof globalThis & { __LM_POSTS__?: Post[] };
export const POSTS: Post[] = (g.__LM_POSTS__ ??= SEED_POSTS);

// ── Phase 5 editor writes (REBUILD §4 Phase 5) ──────────────────────────────
// The editor's publish action appends here. In production this is an INSERT into
// the content store (dual-write/CDC during transition, REBUILD §2); the sample
// array stands in the same way createUser mutates the sample user Map. A post
// published at runtime isn't in generateStaticParams, so Next serves it on-demand
// (dynamicParams default) — i.e. ISR, exactly the read-path rendering model.

const seq = globalThis as typeof globalThis & { __LM_POST_SEQ__?: number };
seq.__LM_POST_SEQ__ ??= 5001;

/** Fresh stable post id for a newly authored post. Kept in the p-#### space the
 *  identity registry (ids.mjs) uses; decoupled from the slug (REBUILD §3A).
 *  Counter is globalThis-backed for the same cross-layer reason as POSTS. */
export function nextPostId(): string {
  return `p-${seq.__LM_POST_SEQ__!++}`;
}

/** Append a newly authored post to the content source. Caller (publish action)
 *  has already validated fields and confirmed slug uniqueness. */
export function addPost(post: Post): void {
  POSTS.push(post);
}

/** Replace an existing post in place by id (editor "save"). No-op if the id is
 *  gone. In production this is an UPDATE on the content store (dual-write/CDC,
 *  REBUILD §2); the id is the immutable key so the URL/slug may change but the
 *  record identity — and everything that references it — does not. */
export function updatePost(post: Post): void {
  const i = POSTS.findIndex((p) => p.id === post.id);
  if (i >= 0) POSTS[i] = post;
}

/** Remove a post by id (editor "delete"). Returns whether a row was removed.
 *  Production equivalent: a soft/hard DELETE on the content store. */
export function deletePost(id: string): boolean {
  const i = POSTS.findIndex((p) => p.id === id);
  if (i < 0) return false;
  POSTS.splice(i, 1);
  return true;
}
