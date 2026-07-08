# Phase 7 — ডেটা persistence যোগ করা হলো (SQLite)

আগে সব ডেটা (ইউজার, ব্লগ, কমেন্ট, বুকমার্ক, নোটিফিকেশন) সার্ভারের RAM-এ থাকত আর
restart-এ মুছে যেত। এখন একটা **SQLite ডেটাবেজ** যোগ করা হয়েছে, যাতে সব কিছু ডিস্কে
স্থায়ীভাবে থাকে।

## কী নীতিতে করা হয়েছে

- অ্যাপের কোডে storage ছিল ৫টা জায়গায় (`lib/auth/users`, `lib/content/posts`,
  `lib/comments`, `lib/bookmarks`, `lib/notifications`)। এদের **এক্সপোর্ট করা
  ফাংশন হুবহু আগের মতোই আছে** — বাইরের কোনো কোড বদলাতে হয়নি। শুধু ভেতরে ডেটাবেজে
  পড়া-লেখা যোগ হয়েছে।
- একটা নতুন কেন্দ্রীয় লেয়ার: `lib/db/index.mjs` — এখানেই schema আর সব
  পড়া-লেখা।
- **ছবি:** আগের মতোই `public/uploads/`-এ ডিস্কে থাকে (VPS-এ টেকে)। এখন সেই ছবির
  রেফারেন্স পোস্টের সাথে ডেটাবেজেও সেভ হয়, তাই restart-এর পর ছবি আর "orphan" হয় না।

## সবচেয়ে গুরুত্বপূর্ণ: persistence **opt-in**

`DATABASE_PATH` নামের environment variable সেট থাকলে persistence চালু, না থাকলে
অ্যাপ আগের মতোই (in-memory, restart-এ মুছে যায়) চলে।

- এতে **টেস্ট আর `next build` অপরিবর্তিত** থাকে (৩৬টা টেস্টই পাস করে, build হয়)।
- সার্ভারে শুধু একটা env দিয়ে persistence চালু করবেন — নিচে দেখানো আছে।

## চালু করার নিয়ম (VPS-এ)

`.env.local` ফাইলে আগের দুটোর সাথে এই লাইনটা যোগ করুন:

```ini
SESSION_SECRET=...            # আগের মতোই
NEXT_PUBLIC_SITE_URL=https://your-domain.com
DATABASE_PATH=./data/lostmodesty.db     # ← নতুন: এই লাইনটা যোগ করলেই persistence চালু
```

তারপর `better-sqlite3` ইনস্টল করুন (sharp-এর মতোই একটা native module):

```bash
npm install           # package.json-এ better-sqlite3 যোগ করা আছে, তাই npm ci নয় — npm install
npm run build
pm2 restart lostmodesty     # বা প্রথমবার: pm2 start npm --name lostmodesty -- start
```

ব্যস। এবার কেউ রেজিস্টার করলে, ব্লগ পাবলিশ করলে, কমেন্ট করলে — restart/redeploy-এও
সব থাকবে। ডেটাবেজ ফাইলটা তৈরি হবে `data/lostmodesty.db`-তে।

> ⚠️ `data/` ফোল্ডারটা ব্যাকআপ রাখবেন আর `git pull`-এ যেন না মোছে (git-ignore করা
> ভালো)। এখানেই আপনার আসল ডেটা।

## যাচাই (ঐচ্ছিক)

সঙ্গে একটা ছোট স্ক্রিপ্ট দেওয়া আছে যা restart-এও ডেটা টেকে কিনা প্রমাণ করে:

```bash
DATABASE_PATH=/tmp/t.db node scripts/persist-smoke.mjs write
DATABASE_PATH=/tmp/t.db node scripts/persist-smoke.mjs read   # সব ✅ দেখাবে
```

## এখনো যেটা মনে রাখবেন

- **একটাই process** — SQLite ফাইলে single writer, তাই আগের মতোই PM2 fork mode, ১টা
  instance (cluster নয়)। এই constraint বদলায়নি।
- **ছবি** এখন লোকাল ডিস্কে। ভবিষ্যতে অনেক ট্রাফিক/একাধিক সার্ভার হলে ছবি একটা
  CDN/object storage-এ সরানো যায় — কোডে সেই জায়গাটা (`lib/content/uploads.ts`)
  ইচ্ছে করে আলাদা রাখা, সহজে বদলানো যাবে।

## পরিবর্তিত/নতুন ফাইলের তালিকা

- `lib/db/index.mjs` — নতুন (persistence লেয়ার)
- `lib/auth/users.mjs` — hydrate + write-through
- `lib/content/posts.ts` — hydrate + write-through
- `lib/comments/store.mjs` — hydrate + write-through
- `lib/bookmarks/store.mjs` — hydrate + write-through
- `lib/notifications/store.mjs` — hydrate + write-through
- `scripts/persist-smoke.mjs` — নতুন (যাচাই স্ক্রিপ্ট)
- `package.json` / `package-lock.json` — `better-sqlite3` যোগ
