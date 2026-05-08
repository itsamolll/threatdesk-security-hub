import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAnalytics } from "@/lib/threatdesk.functions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const SEV_COLORS: Record<string, string> = {
  low: "var(--sev-low)",
  medium: "var(--sev-medium)",
  high: "var(--sev-high)",
  critical: "var(--sev-critical)",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "var(--status-pending)",
  in_progress: "var(--status-progress)",
  under_review: "var(--status-review)",
  resolved: "var(--status-resolved)",
};

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — ThreatDesk" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fetchAnalytics = useServerFn(getAnalytics);
  const q = useQuery({ queryKey: ["analytics"], queryFn: () => fetchAnalytics() });

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="font-mono text-2xl font-semibold tracking-tight">Security analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Posture indicators across all open and resolved findings.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="td-card p-5">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Severity breakdown
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q.data?.severityBreakdown ?? []}>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {(q.data?.severityBreakdown ?? []).map((d: any) => (
                    <Cell key={d.name} fill={SEV_COLORS[d.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="td-card p-5">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Status distribution
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={q.data?.statusBreakdown ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {(q.data?.statusBreakdown ?? []).map((d: any) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {Object.entries(STATUS_COLORS).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: v }} />
                <span className="capitalize text-muted-foreground">{k.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="td-card mt-6 p-5">
        <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
          Recent activity
        </h2>
        <div className="mt-3 divide-y divide-border">
          {(q.data?.recent ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            (q.data?.recent ?? []).map((a: any) => (
              <div key={a.id} className="py-3 text-sm">
                <div>{a.action}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {a.actor?.name ?? "system"} · {a.task?.title ?? ""} ·{" "}
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
