import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";

// Private profile settings (REBUILD §4 Phase 6 / §1#10 "private settings ship
// simplified: avatar, bio, password"). SSR + noindex (not indexed). Any logged-in
// user (reader or author) can edit their name/bio and change their password;
// avatar upload waits on the image pipeline (§2.6), like the editor cover.
//
// Staged behind the strangler-fig: the `profile` route class stays at
// canaryPercent 0 (→ OLD) until its Phase-6 checkpoint.
export const metadata: Metadata = pageMetadata({
  title: "সেটিংস",
  description: "আপনার প্রোফাইল ও পাসওয়ার্ড।",
  path: "/settings",
  noindex: true,
});

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/settings");

  return (
    <div className="mx-auto max-w-article px-4 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-meta text-muted">অ্যাকাউন্ট</p>
        <h1 className="font-display text-display text-text">সেটিংস</h1>
      </header>

      <div className="flex flex-col gap-12">
        <section aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="mb-4 border-b border-border pb-2 font-display text-h2 text-text">
            প্রোফাইল
          </h2>
          <ProfileForm name={user.name} bio={user.bio} />
        </section>

        <section aria-labelledby="password-heading">
          <h2 id="password-heading" className="mb-4 border-b border-border pb-2 font-display text-h2 text-text">
            পাসওয়ার্ড বদলান
          </h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
