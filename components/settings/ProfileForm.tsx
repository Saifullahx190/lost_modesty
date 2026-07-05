"use client";

import { useActionState } from "react";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { updateProfileAction, type ProfileState } from "@/lib/auth/profile-actions";

// Profile form (FRONTEND §2.4 private profile settings — simplified). Display name
// + bio. Works without JS as a plain POST; useActionState adds pending + inline
// state. On success a polite confirmation is announced (not just a silent save).
export function ProfileForm({ name, bio }: { name: string; bio: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfileAction, {});

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      <p role="status" aria-live="polite" className="min-h-[1.25rem] text-meta text-success">
        {state.ok ? "প্রোফাইল সংরক্ষিত হয়েছে।" : ""}
      </p>
      {state.formError && (
        <p role="alert" aria-live="polite" className="text-meta text-danger">
          {state.formError}
        </p>
      )}

      <Input
        label="নাম"
        name="name"
        required
        autoComplete="name"
        defaultValue={state.values?.name ?? name}
        error={state.fieldErrors?.name}
      />
      <Textarea
        label="পরিচিতি (ঐচ্ছিক)"
        name="bio"
        rows={3}
        defaultValue={state.values?.bio ?? bio}
        error={state.fieldErrors?.bio}
        hint="আপনার সম্পর্কে কয়েকটি লাইন — লেখক পাতায় দেখা যেতে পারে।"
      />

      <div className="mt-1">
        <Button type="submit" loading={pending} loadingLabel="সংরক্ষণ হচ্ছে…">
          সংরক্ষণ করুন
        </Button>
      </div>
    </form>
  );
}
