import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsers } from "@/lib/threatdesk.functions";
import { ShieldCheck, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team — ThreatDesk" }] }),
  component: TeamPage,
});

function TeamPage() {
  const fetchUsers = useServerFn(listUsers);
  const usersQ = useQuery({ queryKey: ["users"], queryFn: () => fetchUsers() });

  return (
    <div className="px-6 py-8 md:px-10">
      <div>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone with access to the ThreatDesk operations console.
        </p>
      </div>

      <div className="td-card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Member</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usersQ.isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : usersQ.data?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Just you so far.
                </td>
              </tr>
            ) : (
              (usersQ.data ?? []).map((u: any) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        {u.role === "admin" ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {u.role === "admin" ? "Security Lead" : "Analyst"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
