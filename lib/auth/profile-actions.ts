"use server";

import { getSessionUser, writeHint } from "./session";
import { getUser, updateProfile, updatePasswordHash } from "./users.mjs";
import { hashPassword, verifyPassword } from "./password.mjs";

// Private profile settings actions (REBUILD §4 Phase 6 / §1#10 "private settings
// ship simplified: avatar, bio, password"). Logged-in-only, noindex — every call
// re-verifies the real HttpOnly session (the hint cookie only chooses UI). Plain
// <form action> semantics so both forms work without JS (§3.4); useActionState
// only adds pending + inline states. Avatar upload is deferred with the rest of the
// image pipeline (§2.6), same as the editor cover — name/bio/password ship now.

export interface ProfileState {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string>;
  values?: { name?: string; bio?: string };
}

export interface PasswordState {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string>;
}

const BIO_MAX = 280;

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) return { formError: "প্রোফাইল সম্পাদনা করতে প্রবেশ করুন।" };

  const name = str(formData, "name").trim();
  const bio = str(formData, "bio").trim();

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "নাম খালি রাখা যাবে না।";
  if (bio.length > BIO_MAX) fieldErrors.bio = `পরিচিতি ${BIO_MAX} অক্ষরের মধ্যে রাখুন।`;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values: { name, bio } };

  updateProfile(user.id, { name, bio });

  // Name is shown by the header/UserMenu from the hint cookie — refresh it so the
  // change is visible immediately, without forcing a re-login.
  const updated = getUser(user.id);
  if (updated) await writeHint(updated);

  return { ok: true, values: { name, bio } };
}

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const user = await getSessionUser();
  if (!user) return { formError: "পাসওয়ার্ড বদলাতে প্রবেশ করুন।" };

  const current = str(formData, "current");
  const next = str(formData, "next");
  const confirm = str(formData, "confirm");

  const fieldErrors: Record<string, string> = {};
  if (!current) fieldErrors.current = "বর্তমান পাসওয়ার্ড লিখুন।";
  if (next.length < 8) fieldErrors.next = "নতুন পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।";
  if (confirm !== next) fieldErrors.confirm = "নতুন পাসওয়ার্ড দুটি মেলেনি।";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // Verify the CURRENT password against the stored hash before changing it — a
  // logged-in session alone must not be enough to re-set the password.
  if (!verifyPassword(current, user.passwordHash).ok) {
    return { fieldErrors: { current: "বর্তমান পাসওয়ার্ডটি ঠিক নয়।" } };
  }

  updatePasswordHash(user.id, hashPassword(next));
  return { ok: true };
}
