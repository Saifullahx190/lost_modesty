import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSessionUser } from "@/lib/auth/session";
import { safeReturnPath } from "@/lib/auth/redirects.mjs";
import { pageMetadata } from "@/lib/seo";

// Registration (REBUILD §4 Phase 2). SSR + noindex, same staging rules as
// /login. Success = session created + redirect to the return path.

export const metadata: Metadata = pageMetadata({
  title: "নিবন্ধন",
  description: "লস্টমডেস্টিতে নতুন অ্যাকাউন্ট খুলুন।",
  path: "/register",
  noindex: true,
});

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeReturnPath((await searchParams).next);
  if (await getSessionUser()) redirect(next);

  return (
    <AuthShell title="নিবন্ধন" intro="মন্তব্য আর পছন্দের লেখা সংরক্ষণের জন্য একটি অ্যাকাউন্ট।">
      <RegisterForm next={next} />
    </AuthShell>
  );
}
