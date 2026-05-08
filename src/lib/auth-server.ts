// Server-only Clerk + Supabase helpers. Never import from client code.
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AppUser = {
  id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  role: "admin" | "member";
};

/**
 * Resolve the current authenticated user, syncing them into the `users` table
 * on first visit. The very first user to sign in becomes the admin
 * (Security Lead); everyone after is provisioned as a member.
 *
 * Throws a 401 Response if the request is not authenticated.
 */
export async function requireUser(): Promise<AppUser> {
  const session = await auth();
  if (!session.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const userId = session.userId;

  // Already synced?
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, clerk_user_id, name, email, role")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) return existing as AppUser;

  // First-time provisioning — fetch profile from Clerk.
  const profile = await clerkClient().users.getUser(userId);
  const email =
    profile.primaryEmailAddress?.emailAddress ??
    profile.emailAddresses[0]?.emailAddress ??
    "unknown@threatdesk.local";
  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.username ||
    email.split("@")[0];

  // First ever user → admin (Security Lead).
  const { count } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true });
  const role: AppUser["role"] = (count ?? 0) === 0 ? "admin" : "member";

  const { data: inserted, error } = await supabaseAdmin
    .from("users")
    .insert({ clerk_user_id: userId, name, email, role })
    .select("id, clerk_user_id, name, email, role")
    .single();

  if (error || !inserted) {
    throw new Response(`Failed to provision user: ${error?.message}`, { status: 500 });
  }

  // For new members with no work yet, hand them two demo tasks so the
  // member dashboard isn't empty on first login.
  if (role === "member") {
    const { data: orphans } = await supabaseAdmin
      .from("tasks")
      .select("id")
      .is("assigned_to", null)
      .limit(2);
    if (orphans && orphans.length > 0) {
      await supabaseAdmin
        .from("tasks")
        .update({ assigned_to: inserted.id })
        .in("id", orphans.map((o) => o.id));
    }
  }

  return inserted as AppUser;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}
