// ───────────────────────────────────────────────────────────────────────────
// PERSISTENCE LAYER (Phase 7 — real store cutover).
//
// This is the single place the "real store" from REBUILD §2 lives. The five
// sample stores (lib/auth/users, lib/content/posts, lib/comments, lib/bookmarks,
// lib/notifications) used to keep their data in `globalThis` singletons seeded
// from a SEED constant — durable for one process lifetime, wiped on restart.
// Those stores now KEEP the same globalThis singleton as their in-process read
// source (so every synchronous caller and both of Next's module graphs are
// unchanged), but they hydrate it from — and write it through to — SQLite here.
//
// OPT-IN: persistence is enabled only when DATABASE_PATH is set. With no env,
// every function below is a no-op and the stores fall back to their original
// seed-only, in-memory behaviour — so tests, `next build` SSG, and anyone who
// hasn't provisioned a DB behave exactly as before. Set DATABASE_PATH (e.g.
// ./data/lostmodesty.db) on the server to turn durability on.
//
// SQLite fits this app precisely: one process, one machine (REBUILD §1.1), a
// file on disk that survives restarts, no external service to run. better-sqlite3
// is synchronous, so hydration at module-eval time stays synchronous and the
// exported array/Map shapes the callers expect don't have to become async.
// ───────────────────────────────────────────────────────────────────────────

import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

const RAW = (process.env.DATABASE_PATH ?? "").trim();
export const PERSIST = RAW.length > 0;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  bio           TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL,
  author_slug   TEXT,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id         TEXT PRIMARY KEY,
  slug       TEXT NOT NULL,
  author     TEXT NOT NULL,
  title      TEXT NOT NULL,
  excerpt    TEXT NOT NULL DEFAULT '',
  date       TEXT NOT NULL,
  updated    TEXT,
  categories TEXT NOT NULL DEFAULT '[]',
  tags       TEXT NOT NULL DEFAULT '[]',
  series     TEXT,
  cover      TEXT,
  body       TEXT NOT NULL DEFAULT '[]',
  footnotes  TEXT,
  seed       INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  parent_id  TEXT,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id    TEXT NOT NULL,
  post_id    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, post_id)
);
CREATE TABLE IF NOT EXISTS notif_read (
  user_id TEXT PRIMARY KEY,
  read_at TEXT NOT NULL
);
`;

/** @type {import('better-sqlite3').Database | null} */
let db = null;

if (PERSIST) {
  const g = /** @type {any} */ (globalThis);
  if (!g.__LM_DB__) {
    // Lazy synchronous require so the native module is only loaded when
    // persistence is on (non-persistent builds/tests never need better-sqlite3),
    // and no top-level await ends up in Next's server bundle.
    const require = createRequire(import.meta.url);
    const Database = require("better-sqlite3");
    const file =
      RAW === ":memory:"
        ? ":memory:"
        : path.isAbsolute(RAW)
          ? RAW
          : path.join(process.cwd(), RAW);
    if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
    const conn = new Database(file);
    conn.pragma("journal_mode = WAL");
    conn.exec(SCHEMA);
    g.__LM_DB__ = conn;
  }
  db = g.__LM_DB__;
}

const j = (v) => (v == null ? null : JSON.stringify(v));
const p = (v, fallback) => (v == null ? fallback : JSON.parse(v));

// ── users ───────────────────────────────────────────────────────────────────
const userRow = (r) => ({
  id: r.id,
  email: r.email,
  name: r.name,
  bio: r.bio,
  role: r.role,
  ...(r.author_slug ? { authorSlug: r.author_slug } : {}),
  passwordHash: r.password_hash,
  createdAt: r.created_at,
});

export function dbUsersEmpty() {
  return !db || db.prepare("SELECT 1 FROM users LIMIT 1").get() === undefined;
}
export function dbLoadUsers() {
  if (!db) return [];
  return db.prepare("SELECT * FROM users").all().map(userRow);
}
export function dbUpsertUser(u) {
  if (!db) return;
  db.prepare(
    `INSERT INTO users (id,email,name,bio,role,author_slug,password_hash,created_at)
     VALUES (@id,@email,@name,@bio,@role,@author_slug,@password_hash,@created_at)
     ON CONFLICT(id) DO UPDATE SET
       email=excluded.email, name=excluded.name, bio=excluded.bio, role=excluded.role,
       author_slug=excluded.author_slug, password_hash=excluded.password_hash`,
  ).run({
    id: u.id,
    email: u.email,
    name: u.name,
    bio: u.bio ?? "",
    role: u.role,
    author_slug: u.authorSlug ?? null,
    password_hash: u.passwordHash,
    created_at: u.createdAt,
  });
}

// ── posts ────────────────────────────────────────────────────────────────────
const postRow = (r) => ({
  id: r.id,
  slug: r.slug,
  author: r.author,
  title: r.title,
  excerpt: r.excerpt,
  date: r.date,
  ...(r.updated ? { updated: r.updated } : {}),
  categories: p(r.categories, []),
  tags: p(r.tags, []),
  ...(r.series ? { series: p(r.series, undefined) } : {}),
  ...(r.cover ? { cover: p(r.cover, undefined) } : {}),
  body: p(r.body, []),
  ...(r.footnotes ? { footnotes: p(r.footnotes, undefined) } : {}),
});

export function dbPostsEmpty() {
  return !db || db.prepare("SELECT 1 FROM posts LIMIT 1").get() === undefined;
}
export function dbLoadPosts() {
  if (!db) return [];
  return db.prepare("SELECT * FROM posts ORDER BY rowid").all().map(postRow);
}
export function dbUpsertPost(post, seed = 0) {
  if (!db) return;
  db.prepare(
    `INSERT INTO posts (id,slug,author,title,excerpt,date,updated,categories,tags,series,cover,body,footnotes,seed)
     VALUES (@id,@slug,@author,@title,@excerpt,@date,@updated,@categories,@tags,@series,@cover,@body,@footnotes,@seed)
     ON CONFLICT(id) DO UPDATE SET
       slug=excluded.slug, author=excluded.author, title=excluded.title, excerpt=excluded.excerpt,
       date=excluded.date, updated=excluded.updated, categories=excluded.categories, tags=excluded.tags,
       series=excluded.series, cover=excluded.cover, body=excluded.body, footnotes=excluded.footnotes`,
  ).run({
    id: post.id,
    slug: post.slug,
    author: post.author,
    title: post.title,
    excerpt: post.excerpt ?? "",
    date: post.date,
    updated: post.updated ?? null,
    categories: j(post.categories ?? []),
    tags: j(post.tags ?? []),
    series: j(post.series ?? null),
    cover: j(post.cover ?? null),
    body: j(post.body ?? []),
    footnotes: j(post.footnotes ?? null),
    seed,
  });
}
export function dbDeletePost(id) {
  if (!db) return;
  db.prepare("DELETE FROM posts WHERE id=?").run(id);
}

// ── comments ─────────────────────────────────────────────────────────────────
const commentRow = (r) => ({
  id: r.id,
  postId: r.post_id,
  userId: r.user_id,
  parentId: r.parent_id ?? null,
  body: r.body,
  createdAt: r.created_at,
});

export function dbCommentsEmpty() {
  return !db || db.prepare("SELECT 1 FROM comments LIMIT 1").get() === undefined;
}
export function dbLoadComments() {
  if (!db) return [];
  return db.prepare("SELECT * FROM comments ORDER BY rowid").all().map(commentRow);
}
export function dbInsertComment(c) {
  if (!db) return;
  db.prepare(
    `INSERT INTO comments (id,post_id,user_id,parent_id,body,created_at)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(id) DO NOTHING`,
  ).run(c.id, c.postId, c.userId, c.parentId ?? null, c.body, c.createdAt);
}

// ── bookmarks ────────────────────────────────────────────────────────────────
export function dbBookmarksEmpty() {
  return !db || db.prepare("SELECT 1 FROM bookmarks LIMIT 1").get() === undefined;
}
export function dbLoadBookmarks() {
  if (!db) return [];
  return db
    .prepare("SELECT * FROM bookmarks")
    .all()
    .map((r) => ({ userId: r.user_id, postId: r.post_id, createdAt: r.created_at }));
}
export function dbInsertBookmark(b) {
  if (!db) return;
  db.prepare(
    `INSERT INTO bookmarks (user_id,post_id,created_at) VALUES (?,?,?)
     ON CONFLICT(user_id,post_id) DO NOTHING`,
  ).run(b.userId, b.postId, b.createdAt);
}
export function dbDeleteBookmark(userId, postId) {
  if (!db) return;
  db.prepare("DELETE FROM bookmarks WHERE user_id=? AND post_id=?").run(userId, postId);
}

// ── notifications read-cursor ────────────────────────────────────────────────
export function dbLoadNotifRead() {
  if (!db) return [];
  return db.prepare("SELECT * FROM notif_read").all().map((r) => [r.user_id, r.read_at]);
}
export function dbSetNotifRead(userId, readAt) {
  if (!db) return;
  db.prepare(
    `INSERT INTO notif_read (user_id,read_at) VALUES (?,?)
     ON CONFLICT(user_id) DO UPDATE SET read_at=excluded.read_at`,
  ).run(userId, readAt);
}
