"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthFormState } from "@/lib/auth/actions";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

// Registration form (FRONTEND §2.4 auth forms — M2). Same state model as
// LoginForm; per-field validation errors come back from the server action so
// the no-JS path gets the identical messages (§3.4 hydration contract).
export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(register, {});

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="next" value={next} />

      <p role="alert" aria-live="polite" className="min-h-[1.25rem] text-meta text-danger">
        {state.formError ?? ""}
      </p>

      <Input
        label="নাম"
        name="name"
        autoComplete="name"
        required
        defaultValue={state.values?.name ?? ""}
        error={state.fieldErrors?.name}
      />
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
        label="পাসওয়ার্ড (অন্তত ৮ অক্ষর)"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={state.fieldErrors?.password}
      />
      <Input
        label="পাসওয়ার্ড আবার লিখুন"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />

      <Button type="submit" loading={pending} loadingLabel="অ্যাকাউন্ট খোলা হচ্ছে…">
        নিবন্ধন করুন
      </Button>

      <p className="pt-2 text-meta text-muted">
        আগেই অ্যাকাউন্ট আছে?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-link hover:underline"
        >
          প্রবেশ করুন
        </Link>
      </p>
    </form>
  );
}
