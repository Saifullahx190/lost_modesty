import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth/session";

// Logout endpoint (REBUILD §4 Phase 2). POST-only: logout mutates auth state,
// and a GET logout is a classic CSRF/prefetch footgun (a link crawler or
// browser prefetch must never be able to end a reader's session). The
// dashboard renders it as a <form method="post" action="/logout"> button, so
// it also works with zero JS (§3.4).
export async function POST(): Promise<Response> {
  await destroySession();
  redirect("/");
}
