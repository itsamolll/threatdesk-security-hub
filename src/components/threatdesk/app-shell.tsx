import { Link, useRouterState } from "@tanstack/react-router";
import { UserButton } from "@clerk/tanstack-react-start";
import {
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const ADMIN_ITEMS: Item[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/team", label: "Team", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const MEMBER_ITEMS: Item[] = [
  { to: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListChecks },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export function AppShell({
  role,
  userName,
  children,
}: {
  role: "admin" | "member";
  userName: string;
  children: React.ReactNode;
}) {
  const items = role === "admin" ? ADMIN_ITEMS : MEMBER_ITEMS;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <Link to="/dashboard" className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-mono text-base font-semibold">ThreatDesk</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border px-5 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Role
          </div>
          <div className="mt-1 text-sm font-medium capitalize text-foreground">
            {role === "admin" ? "Security Lead" : "Analyst"}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase text-muted-foreground">
              ThreatDesk · {role === "admin" ? "Operations" : "My queue"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {userName}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
