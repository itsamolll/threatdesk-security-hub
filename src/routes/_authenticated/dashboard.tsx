import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAnalytics, listTasks, getMe } from "@/lib/threatdesk.functions";
import { StatCard, SeverityBadge, StatusBadge } from "@/components/threatdesk/badges";
import {
  ShieldAlert,
  CheckCircle2,
  Clock4,
  Activity,
  ListChecks,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ThreatDesk" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchAnalytics = useServerFn(getAnalytics);
  const fetchTasks = useServerFn(listTasks);
  const fetchMe = useServerFn(getMe);

  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), staleTime: 60_000 });
  const analyticsQ = useQuery({ queryKey: ["analytics"], queryFn: () => fetchAnalytics() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const role = meQ.data?.role ?? "member";
  const stats = analyticsQ.data?.stats;
  const tasks = (tasksQ.data ?? []).slice(0, 6);

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">
            {role === "admin" ? "Operations overview" : "My security queue"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "admin"
              ? "Live status of every active investigation across the team."
              : "Findings assigned to you. Triage, investigate, resolve."}
          </p>
        </div>
        <Link
          to="/tasks"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
        >
          View all tasks
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={stats?.total ?? "—"}
          icon={ListChecks}
          tone="info"
        />
        <StatCard
          label="Critical issues"
          value={stats?.critical ?? "—"}
          icon={AlertTriangle}
          tone="critical"
        />
        <StatCard
          label="In progress"
          value={stats?.in_progress ?? "—"}
          icon={Activity}
          tone="info"
        />
        <StatCard
          label="Resolved"
          value={stats?.resolved ?? "—"}
          icon={CheckCircle2}
          tone="good"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={stats?.pending ?? "—"} />
        <StatCard label="Under review" value={stats?.under_review ?? "—"} />
        <StatCard
          label="Overdue"
          value={stats?.overdue ?? "—"}
          tone="warning"
          icon={Clock4}
        />
        <StatCard
          label="Active vulnerabilities"
          value={(stats?.in_progress ?? 0) + (stats?.under_review ?? 0)}
          icon={ShieldAlert}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="td-card lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Recent tasks
            </h2>
            <Link to="/tasks" className="text-xs text-primary hover:underline">
              See all →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {tasksQ.isLoading ? (
              <RowSkeletons />
            ) : tasks.length === 0 ? (
              <EmptyState message="No tasks yet — the operations queue is clear." />
            ) : (
              tasks.map((t: any) => (
                <Link
                  key={t.id}
                  to="/tasks/$id"
                  params={{ id: t.id }}
                  className="flex items-center justify-between gap-4 py-3 text-sm hover:opacity-90"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{t.title}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {t.category}
                      {t.assignee ? ` · ${t.assignee.name}` : " · unassigned"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge value={t.severity} />
                    <StatusBadge value={t.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="td-card p-5">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <div className="mt-4 space-y-3">
            {(analyticsQ.data?.recent ?? []).slice(0, 6).map((a: any) => (
              <div key={a.id} className="text-sm">
                <div className="text-foreground">{a.action}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {a.actor?.name ?? "system"} · {a.task?.title ?? ""}
                </div>
              </div>
            ))}
            {(!analyticsQ.data?.recent || analyticsQ.data.recent.length === 0) && (
              <EmptyState message="No activity yet." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowSkeletons() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
      {message}
    </div>
  );
}
