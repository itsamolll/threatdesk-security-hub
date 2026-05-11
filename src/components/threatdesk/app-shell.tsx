import { UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/threatdesk-store";

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
  pathname,
  navigate,
  logout,
  clerkEnabled,
}: {
  role: Role;
  userName: string;
  children: React.ReactNode;
  pathname: string;
  navigate: (path: string) => void;
  logout: () => void;
  clerkEnabled: boolean;
}) {
  const items = role === "admin" ? ADMIN_ITEMS : MEMBER_ITEMS;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4 text-left"
        >
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-mono text-base font-semibold">ThreatDesk</span>
        </button>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.to || (item.to === "/tasks" && pathname.startsWith("/tasks/"));
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border px-5 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Role</div>
          <div className="mt-1 text-sm font-medium capitalize text-foreground">
            {role === "admin" ? "Security Lead" : "Analyst"}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <span className="font-mono text-xs uppercase text-muted-foreground">
              ThreatDesk · {role === "admin" ? "Operations" : "My queue"}
            </span>
            <div className="mt-3 flex flex-wrap gap-1 md:hidden">
              {items.map((item) => (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs",
                    pathname === item.to ? "border-primary text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
            {clerkEnabled ? (
              <UserButton />
            ) : (
              <button
                onClick={logout}
                className="rounded-md border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
