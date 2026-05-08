import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe, getAnalytics } from "@/lib/threatdesk.functions";
import { StatCard } from "@/components/threatdesk/badges";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — ThreatDesk" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useUser();
  const fetchMe = useServerFn(getMe);
  const fetchAnalytics = useServerFn(getAnalytics);
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), staleTime: 60_000 });
  const aQ = useQuery({ queryKey: ["analytics"], queryFn: () => fetchAnalytics() });

  const stats = aQ.data?.stats;

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="font-mono text-2xl font-semibold tracking-tight">Profile</h1>
      <div className="td-card mt-6 max-w-xl p-6">
        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={meQ.data?.name ?? "avatar"}
              className="h-14 w-14 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-secondary" />
          )}
          <div>
            <div className="text-lg font-semibold">{meQ.data?.name}</div>
            <div className="text-sm text-muted-foreground">{meQ.data?.email}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {meQ.data?.role === "admin" ? "Security Lead" : "Analyst"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned" value={stats?.total ?? "—"} />
        <StatCard label="In progress" value={stats?.in_progress ?? "—"} tone="info" />
        <StatCard label="Resolved" value={stats?.resolved ?? "—"} tone="good" />
        <StatCard label="Critical" value={stats?.critical ?? "—"} tone="critical" />
      </div>
    </div>
  );
}
