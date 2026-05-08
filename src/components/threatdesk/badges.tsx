import * as React from "react";
import { cn } from "@/lib/utils";

type Sev = "low" | "medium" | "high" | "critical";
type Status = "pending" | "in_progress" | "under_review" | "resolved" | "overdue";

const SEV_LABEL: Record<Sev, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
const SEV_CLASS: Record<Sev, string> = {
  low: "bg-sev-low/15 text-sev-low border-sev-low/30",
  medium: "bg-sev-medium/15 text-sev-medium border-sev-medium/30",
  high: "bg-sev-high/15 text-sev-high border-sev-high/30",
  critical: "bg-sev-critical/15 text-sev-critical border-sev-critical/40",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  under_review: "Under Review",
  resolved: "Resolved",
  overdue: "Overdue",
};
const STATUS_CLASS: Record<Status, string> = {
  pending: "bg-status-pending/15 text-status-pending border-status-pending/30",
  in_progress: "bg-status-progress/15 text-status-progress border-status-progress/40",
  under_review: "bg-status-review/15 text-status-review border-status-review/40",
  resolved: "bg-status-resolved/15 text-status-resolved border-status-resolved/40",
  overdue: "bg-status-overdue/15 text-status-overdue border-status-overdue/40",
};

export function SeverityBadge({ value, className }: { value: Sev; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        SEV_CLASS[value],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {SEV_LABEL[value]}
    </span>
  );
}

export function StatusBadge({ value, className }: { value: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        STATUS_CLASS[value],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[value]}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "critical" | "warning" | "good" | "info";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = {
    default: "text-foreground",
    critical: "text-sev-critical",
    warning: "text-sev-high",
    good: "text-status-resolved",
    info: "text-primary",
  }[tone];
  return (
    <div className="td-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
      <div className={cn("mt-3 font-mono text-3xl font-semibold", toneClass)}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
