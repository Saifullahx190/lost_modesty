"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/lib/auth/actions";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

// Login form (FRONTEND §2.4 auth forms — M2). States: default, per-field error,
// form-level error, submitting (named action label, §3.3), success (server
// redirect to the sanitized return path). Works without JS as a plain form
// POST; useActionState only adds the pending/inline-error enhancements.
// A migrated account logs in identically to a new one — the hash upgrade is
// invisible here by design (REBUILD §3E).
export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="next" value={next} />

      {/* Form-level error: announced, specific, and above the fields (§1.3). */}
      <p role="alert" aria-live="polite" className="min-h-[1.25rem] text-meta text-danger">
        {state.formError ?? ""}
      </p>

      <Input
        label="ইমেইল"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email ?? ""}
        error={state.fieldErrors?.email}
      />
      <Input
        label="পাসওয়ার্ড"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <Button type="submit" loading={pending} loadingLabel="প্রবেশ করা হচ্ছে…">
        প্রবেশ করুন
      </Button>

      <p className="pt-2 text-meta text-muted">
        অ্যাকাউন্ট নেই?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="text-link hover:underline"
        >
          নিবন্ধন করুন
        </Link>
      </p>
    </form>
  );
}
