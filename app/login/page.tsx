import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSessionUser } from "@/lib/auth/session";
import { safeReturnPath } from "@/lib/auth/redirects.mjs";
import { pageMetadata } from "@/lib/seo";

// Login (REBUILD §4 Phase 2 / FRONTEND §3.1 #6). SSR + noindex (REBUILD §1#3:
// login pages are noindex — low direct SEO risk). Carries ?next= so a reader
// bounced here from a comment/bookmark CTA returns to where they were (§3.4).
//
// Staged behind the strangler-fig: the `auth` route class stays at
// canaryPercent 0 (→ OLD) until Checkpoint 2 (login-success-rate parity,
// hash/cookie continuity) passes.

export const metadata: Metadata = pageMetadata({
  title: "প্রবেশ",
  description: "লস্টমডেস্টি অ্যাকাউন্টে প্রবেশ করুন।",
  path: "/login",
  noindex: true,
});

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeReturnPath((await searchParams).next);
  // Already signed in → straight to the return path, no dead login form.
  if (await getSessionUser()) redirect(next);

  return (
    <AuthShell title="প্রবেশ" intro="আগের অ্যাকাউন্ট আগের পাসওয়ার্ডেই চলবে — নতুন করে কিছু করতে হবে না।">
      <LoginForm next={next} />
    </AuthShell>
  );
}
