"use server";

import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "./password.mjs";
import { createUser, findUserByEmail, updatePasswordHash } from "./users.mjs";
import { safeReturnPath } from "./redirects.mjs";
import { createSession, destroySession, getSessionUser } from "./session";

// Auth server actions (REBUILD §4 Phase 2 / FRONTEND §2.4 auth forms). Plain
// <form action> semantics so login/register WORK WITHOUT JS (§3.4 hydration
// contract); useActionState only enhances with pending + inline states.
//
// Error copy is Bengali, specific, and per-field (§1.3 forms); login failure
// is deliberately ONE generic message so the form can't be used to enumerate
// which emails have accounts.

export interface AuthFormState {
  /** Form-level error (e.g. credentials didn't match). */
  formError?: string;
  /** Per-field errors keyed by input name (§1.3: tied via aria-describedby). */
  fieldErrors?: Record<string, string>;
  /** Sticky values so a failed submit never eats what the user typed (§3.3) —
   *  passwords are never echoed back. */
  values?: { name?: string; email?: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Verified against when the email has no account, so unknown-email and
 *  wrong-password responses take comparable time (no account enumeration
 *  via timing). */
const DUMMY_HASH = hashPassword("timing-equalizer");

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = str(formData, "email").trim();
  const password = str(formData, "password");
  const next = safeReturnPath(str(formData, "next") || undefined);

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "ইমেইল লিখুন।";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "ইমেইল ঠিকানাটি ঠিক নয়।";
  if (!password) fieldErrors.password = "পাসওয়ার্ড লিখুন।";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values: { email } };

  const user = findUserByEmail(email);
  const result = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !result.ok) {
    return { formError: "ইমেইল বা পাসওয়ার্ডটি মেলেনি।", values: { email } };
  }

  // Transparent scheme upgrade for migrated accounts (REBUILD §3E: re-hash on
  // next login, no forced reset, no UI difference).
  if (result.needsRehash) updatePasswordHash(user.id, hashPassword(password));

  await createSession(user);
  redirect(next);
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = str(formData, "name").trim();
  const email = str(formData, "email").trim();
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  const next = safeReturnPath(str(formData, "next") || undefined);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "নাম লিখুন।";
  if (!email) fieldErrors.email = "ইমেইল লিখুন।";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "ইমেইল ঠিকানাটি ঠিক নয়।";
  if (password.length < 8) fieldErrors.password = "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।";
  if (confirm !== password) fieldErrors.confirm = "পাসওয়ার্ড দুটি মেলেনি।";
  if (!fieldErrors.email && findUserByEmail(email)) {
    fieldErrors.email = "এই ইমেইলে আগে থেকেই অ্যাকাউন্ট আছে — প্রবেশ করে দেখুন।";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values: { name, email } };

  const user = createUser({ name, email, password });
  await createSession(user);
  redirect(next);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Session probe for client islands that need the REAL session (not the UI
 *  hint) without making their host page dynamic — e.g. BookmarkButton asking
 *  "is this post saved for me?" after mount. */
export async function whoami(): Promise<{ id: string; name: string; role: string } | null> {
  const user = await getSessionUser();
  return user ? { id: user.id, name: user.name, role: user.role } : null;
}
