"use client";

import { useActionState, useRef, useEffect } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { changePasswordAction, type PasswordState } from "@/lib/auth/profile-actions";

// Password change (FRONTEND §2.4 private profile settings). Requires the CURRENT
// password — a live session alone can't reset it (see profile-actions). Works
// without JS; useActionState adds pending + inline errors. On success the fields
// are cleared so a shoulder-surfer can't read the just-typed password back.
export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2" noValidate>
      <p role="status" aria-live="polite" className="min-h-[1.25rem] text-meta text-success">
        {state.ok ? "পাসওয়ার্ড বদলানো হয়েছে।" : ""}
      </p>
      {state.formError && (
        <p role="alert" aria-live="polite" className="text-meta text-danger">
          {state.formError}
        </p>
      )}

      <Input
        label="বর্তমান পাসওয়ার্ড"
        name="current"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.current}
      />
      <Input
        label="নতুন পাসওয়ার্ড"
        name="next"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.next}
      />
      <Input
        label="নতুন পাসওয়ার্ড আবার লিখুন"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />

      <div className="mt-1">
        <Button type="submit" loading={pending} loadingLabel="বদলানো হচ্ছে…">
          পাসওয়ার্ড বদলান
        </Button>
      </div>
    </form>
  );
}
