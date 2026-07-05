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

export const AUTHORS: Author[] = [
  {
    slug: "tahsin",
    name: "তাহসিন আহমেদ",
    bio: "গদ্য আর ধারাবাহিক গল্প লেখেন। রাত জাগা, শহর আর হারিয়ে যাওয়া মানুষ নিয়ে।",
  },
  {
    slug: "rumki",
    name: "রুমকি বসু",
    bio: "প্রবন্ধ ও স্মৃতিগদ্য। সম্পর্ক, রাজনীতি আর নিঃসঙ্গতার মাঝখানে দাঁড়িয়ে লেখা।",
  },
];

export const CATEGORIES: Term[] = [
  { slug: "golpo", name: "গল্প", description: "ছোটগল্প ও ধারাবাহিক আখ্যান।" },
  { slug: "probondho", name: "প্রবন্ধ", description: "চিন্তা, সমাজ ও সম্পর্ক নিয়ে গদ্য।" },
  { slug: "love", name: "প্রেম", description: "প্রেম, বিচ্ছেদ আর তার মাঝখানের ধূসর জায়গাগুলো।" },
];

export const TAGS: Term[] = [
  { slug: "poetry", name: "কবিতা" },
  { slug: "raat", name: "রাত" },
  { slug: "smriti", name: "স্মৃতি" },
  { slug: "rajniti", name: "রাজনীতি" },
  { slug: "dhara", name: "ধারাবাহিক" },
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
