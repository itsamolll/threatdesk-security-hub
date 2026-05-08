import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/tanstack-react-start";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/threatdesk.functions";
import { AppShell } from "@/components/threatdesk/app-shell";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const fetchMe = useServerFn(getMe);

  // Sync + fetch the current ThreatDesk user record (creates on first visit).
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe(),
    enabled: !!isSignedIn,
    staleTime: 60_000,
  });

  if (!isLoaded) return <FullPageStatus message="Authenticating session…" />;

  if (!isSignedIn) {
    // Client-side redirect — Clerk hasn't issued a session.
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return <FullPageStatus message="Redirecting to login…" />;
  }

  if (meQuery.isLoading) return <FullPageStatus message="Loading workspace…" />;
  if (meQuery.error || !meQuery.data)
    return <FullPageStatus message="Could not load your account." error />;

  const me = meQuery.data;
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : me.name;

  return (
    <AppShell role={me.role} userName={displayName}>
      <Outlet />
    </AppShell>
  );
}

function FullPageStatus({ message, error }: { message: string; error?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="td-card max-w-md p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {error ? "Error" : "ThreatDesk"}
        </div>
        <div className="mt-2 text-foreground">{message}</div>
      </div>
    </div>
  );
}
