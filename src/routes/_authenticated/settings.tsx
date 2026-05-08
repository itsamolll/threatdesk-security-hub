import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/threatdesk.functions";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ThreatDesk" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const fetchMe = useServerFn(getMe);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), staleTime: 60_000 });

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="font-mono text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="td-card mt-6 max-w-xl p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-mono uppercase tracking-wider text-muted-foreground text-xs">
            Account
          </h2>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Name" value={me.data?.name ?? "—"} />
          <Row label="Email" value={me.data?.email ?? "—"} />
          <Row
            label="Role"
            value={me.data?.role === "admin" ? "Security Lead (Admin)" : "Analyst (Member)"}
          />
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">
          Profile details are managed through your authentication provider. Sign out
          from the avatar menu in the top right to switch accounts.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-2">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
