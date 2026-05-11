import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Role = "admin" | "member";
export type Severity = "low" | "medium" | "high" | "critical";
export type Status = "pending" | "in_progress" | "under_review" | "resolved";
export type Priority = "low" | "medium" | "high" | "critical";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  priority: Priority;
  status: Status;
  due_date: string;
  created_at: string;
  updated_at: string;
  project_id: string | null;
  assigned_to: string | null;
  created_by: string;
};

export type Note = {
  id: string;
  task_id: string;
  user_id: string;
  note: string;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  task_id: string | null;
  user_id: string;
  action: string;
  created_at: string;
};

type CreateTaskInput = Omit<Task, "id" | "created_at" | "updated_at" | "created_by" | "status"> & {
  status?: Status;
};

type StoreState = {
  role: Role;
  setRole: (role: Role) => void;
  me: User;
  users: User[];
  projects: Project[];
  tasks: EnrichedTask[];
  notes: Note[];
  activity: ActivityLog[];
  visibleTasks: EnrichedTask[];
  createProject: (project: Pick<Project, "name" | "description">) => void;
  createTask: (task: CreateTaskInput) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: Status) => void;
  assignTask: (id: string, assignedTo: string | null) => void;
  addNote: (taskId: string, note: string) => void;
  getTaskBundle: (id: string) => { task: EnrichedTask; notes: EnrichedNote[]; logs: EnrichedActivity[] } | null;
  analytics: Analytics;
};

export type EnrichedTask = Task & {
  project: Pick<Project, "id" | "name"> | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  creator: Pick<User, "id" | "name"> | null;
};

export type EnrichedNote = Note & { author: Pick<User, "id" | "name"> | null };
export type EnrichedActivity = ActivityLog & {
  actor: Pick<User, "id" | "name"> | null;
  task: Pick<Task, "id" | "title"> | null;
};

export type Analytics = {
  stats: {
    total: number;
    resolved: number;
    in_progress: number;
    pending: number;
    under_review: number;
    critical: number;
    overdue: number;
  };
  severityBreakdown: { name: Severity; value: number }[];
  statusBreakdown: { name: Status; value: number }[];
  recent: EnrichedActivity[];
};

const USERS: User[] = [
  { id: "u-admin", name: "Maya Chen", email: "maya@threatdesk.local", role: "admin", created_at: "2026-01-04T09:00:00.000Z" },
  { id: "u-member", name: "Jordan Patel", email: "jordan@threatdesk.local", role: "member", created_at: "2026-01-06T10:30:00.000Z" },
  { id: "u-analyst", name: "Sam Rivera", email: "sam@threatdesk.local", role: "member", created_at: "2026-01-08T13:15:00.000Z" },
];

const PROJECTS: Project[] = [
  { id: "p-network", name: "Q2 Network Exposure Review", description: "External attack-surface checks across perimeter services and DNS records.", created_at: "2026-04-04T09:00:00.000Z" },
  { id: "p-firewall", name: "Firewall Rule Cleanup", description: "Validate stale allow rules, privileged VPN access, and emergency exceptions.", created_at: "2026-04-15T11:00:00.000Z" },
  { id: "p-identity", name: "Identity Hardening Sprint", description: "Review authentication logs, stale accounts, and MFA enforcement gaps.", created_at: "2026-05-02T14:00:00.000Z" },
];

const TASKS: Task[] = [
  {
    id: "t-open-ports",
    title: "Open Port Exposure Review",
    description: "Validate the public scan findings for TCP/22 and TCP/3389 exposure. Confirm business owner and mitigation window.",
    category: "Open Port Review",
    severity: "high",
    priority: "high",
    status: "in_progress",
    due_date: "2026-05-18",
    created_at: "2026-05-08T08:00:00.000Z",
    updated_at: "2026-05-09T09:10:00.000Z",
    project_id: "p-network",
    assigned_to: "u-member",
    created_by: "u-admin",
  },
  {
    id: "t-firewall-rules",
    title: "Firewall Rule Audit",
    description: "Review broad source ranges and remove temporary allow rules older than 30 days.",
    category: "Firewall Audit",
    severity: "medium",
    priority: "medium",
    status: "pending",
    due_date: "2026-05-22",
    created_at: "2026-05-07T10:00:00.000Z",
    updated_at: "2026-05-07T10:00:00.000Z",
    project_id: "p-firewall",
    assigned_to: "u-analyst",
    created_by: "u-admin",
  },
  {
    id: "t-internal-scan",
    title: "Internal Network Scan Review",
    description: "Prioritize critical findings from the latest internal scanner export and document false positives.",
    category: "Internal Network Scan",
    severity: "critical",
    priority: "critical",
    status: "under_review",
    due_date: "2026-05-14",
    created_at: "2026-05-06T12:30:00.000Z",
    updated_at: "2026-05-10T15:45:00.000Z",
    project_id: "p-network",
    assigned_to: "u-member",
    created_by: "u-admin",
  },
  {
    id: "t-dns-drift",
    title: "DNS Record Drift Check",
    description: "Compare current public DNS records against approved inventory and flag unowned records.",
    category: "DNS Security",
    severity: "low",
    priority: "low",
    status: "resolved",
    due_date: "2026-05-11",
    created_at: "2026-05-03T16:00:00.000Z",
    updated_at: "2026-05-10T10:20:00.000Z",
    project_id: "p-network",
    assigned_to: "u-member",
    created_by: "u-admin",
  },
  {
    id: "t-vpn-access",
    title: "VPN Access Review",
    description: "Verify inactive contractor VPN accounts and revoke access that lacks an approved sponsor.",
    category: "VPN Access Review",
    severity: "high",
    priority: "high",
    status: "pending",
    due_date: "2026-05-17",
    created_at: "2026-05-05T09:00:00.000Z",
    updated_at: "2026-05-05T09:00:00.000Z",
    project_id: "p-identity",
    assigned_to: "u-analyst",
    created_by: "u-admin",
  },
];

const NOTES: Note[] = [
  { id: "n-1", task_id: "t-open-ports", user_id: "u-member", note: "Confirmed TCP/3389 is exposed only through a temporary jump host rule. Waiting on owner confirmation.", created_at: "2026-05-09T09:10:00.000Z" },
  { id: "n-2", task_id: "t-internal-scan", user_id: "u-member", note: "Two critical scanner findings are duplicate plugin detections; one remains valid on the staging subnet.", created_at: "2026-05-10T15:45:00.000Z" },
];

const ACTIVITY: ActivityLog[] = [
  { id: "a-1", task_id: "t-internal-scan", user_id: "u-member", action: "Moved task to under review", created_at: "2026-05-10T15:45:00.000Z" },
  { id: "a-2", task_id: "t-dns-drift", user_id: "u-member", action: "Resolved DNS drift finding", created_at: "2026-05-10T10:20:00.000Z" },
  { id: "a-3", task_id: "t-open-ports", user_id: "u-member", action: "Added investigation note", created_at: "2026-05-09T09:10:00.000Z" },
  { id: "a-4", task_id: "t-vpn-access", user_id: "u-admin", action: "Created task \"VPN Access Review\"", created_at: "2026-05-05T09:00:00.000Z" },
];

const STORAGE_KEY = "threatdesk-spa-state-v2";
const ROLE_KEY = "td_role_intent";

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readInitialRole(): Role {
  if (typeof window === "undefined") return "admin";
  return window.localStorage.getItem(ROLE_KEY) === "member" ? "member" : "admin";
}

function readStoredData() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as { projects: Project[]; tasks: Task[]; notes: Note[]; activity: ActivityLog[] } : null;
  } catch {
    return null;
  }
}

const ThreatDeskContext = createContext<StoreState | null>(null);

export function ThreatDeskProvider({ children }: { children: React.ReactNode }) {
  const stored = useMemo(() => readStoredData(), []);
  const [role, setRoleState] = useState<Role>(readInitialRole);
  const [projects, setProjects] = useState<Project[]>(stored?.projects ?? PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(stored?.tasks ?? TASKS);
  const [notes, setNotes] = useState<Note[]>(stored?.notes ?? NOTES);
  const [activity, setActivity] = useState<ActivityLog[]>(stored?.activity ?? ACTIVITY);

  const me = role === "admin" ? USERS[0] : USERS[1];

  const persist = useCallback((next: { projects?: Project[]; tasks?: Task[]; notes?: Note[]; activity?: ActivityLog[] }) => {
    if (typeof window === "undefined") return;
    const payload = {
      projects: next.projects ?? projects,
      tasks: next.tasks ?? tasks,
      notes: next.notes ?? notes,
      activity: next.activity ?? activity,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [activity, notes, projects, tasks]);

  const addActivity = useCallback((action: string, taskId: string | null, userId = me.id) => {
    const next = [{ id: newId("a"), action, task_id: taskId, user_id: userId, created_at: nowIso() }, ...activity];
    setActivity(next);
    persist({ activity: next });
  }, [activity, me.id, persist]);

  const setRole = useCallback((nextRole: Role) => {
    setRoleState(nextRole);
    if (typeof window !== "undefined") window.localStorage.setItem(ROLE_KEY, nextRole);
  }, []);

  const enrichTask = useCallback((task: Task): EnrichedTask => ({
    ...task,
    project: task.project_id ? projects.find((p) => p.id === task.project_id) ?? null : null,
    assignee: task.assigned_to ? USERS.find((u) => u.id === task.assigned_to) ?? null : null,
    creator: USERS.find((u) => u.id === task.created_by) ?? null,
  }), [projects]);

  const visibleTasks = useMemo(() => {
    const scoped = role === "admin" ? tasks : tasks.filter((task) => task.assigned_to === me.id);
    return scoped.map(enrichTask).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [enrichTask, me.id, role, tasks]);

  const createProject = useCallback((project: Pick<Project, "name" | "description">) => {
    const row: Project = { id: newId("p"), created_at: nowIso(), name: project.name.trim(), description: project.description.trim() };
    const next = [row, ...projects];
    setProjects(next);
    persist({ projects: next });
    addActivity(`Created project "${row.name}"`, null);
  }, [addActivity, persist, projects]);

  const createTask = useCallback((task: CreateTaskInput) => {
    const row: Task = {
      ...task,
      id: newId("t"),
      status: task.status ?? "pending",
      created_by: me.id,
      created_at: nowIso(),
      updated_at: nowIso(),
      title: task.title.trim(),
      description: task.description.trim(),
      project_id: task.project_id || null,
      assigned_to: task.assigned_to || null,
    };
    const next = [row, ...tasks];
    setTasks(next);
    persist({ tasks: next });
    addActivity(`Created task "${row.title}"`, row.id);
  }, [addActivity, me.id, persist, tasks]);

  const deleteTask = useCallback((id: string) => {
    const task = tasks.find((item) => item.id === id);
    const nextTasks = tasks.filter((item) => item.id !== id);
    const nextNotes = notes.filter((item) => item.task_id !== id);
    const nextActivity = [{ id: newId("a"), action: `Deleted task "${task?.title ?? id}"`, task_id: null, user_id: me.id, created_at: nowIso() }, ...activity.filter((item) => item.task_id !== id)];
    setTasks(nextTasks);
    setNotes(nextNotes);
    setActivity(nextActivity);
    persist({ tasks: nextTasks, notes: nextNotes, activity: nextActivity });
  }, [activity, me.id, notes, persist, tasks]);

  const updateTaskStatus = useCallback((id: string, status: Status) => {
    const next = tasks.map((task) => task.id === id ? { ...task, status, updated_at: nowIso() } : task);
    setTasks(next);
    persist({ tasks: next });
    addActivity(`Status changed to ${status.replace("_", " ")}`, id);
  }, [addActivity, persist, tasks]);

  const assignTask = useCallback((id: string, assignedTo: string | null) => {
    const next = tasks.map((task) => task.id === id ? { ...task, assigned_to: assignedTo, updated_at: nowIso() } : task);
    setTasks(next);
    persist({ tasks: next });
    const assignee = USERS.find((user) => user.id === assignedTo);
    addActivity(assignee ? `Assigned task to ${assignee.name}` : "Unassigned task", id);
  }, [addActivity, persist, tasks]);

  const addNote = useCallback((taskId: string, note: string) => {
    const row: Note = { id: newId("n"), task_id: taskId, user_id: me.id, note: note.trim(), created_at: nowIso() };
    const next = [...notes, row];
    setNotes(next);
    persist({ notes: next });
    addActivity("Added investigation note", taskId);
  }, [addActivity, me.id, notes, persist]);

  const analytics = useMemo<Analytics>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const scoped = visibleTasks;
    const stats = {
      total: scoped.length,
      resolved: scoped.filter((t) => t.status === "resolved").length,
      in_progress: scoped.filter((t) => t.status === "in_progress").length,
      pending: scoped.filter((t) => t.status === "pending").length,
      under_review: scoped.filter((t) => t.status === "under_review").length,
      critical: scoped.filter((t) => t.severity === "critical").length,
      overdue: scoped.filter((t) => t.due_date < today && t.status !== "resolved").length,
    };
    return {
      stats,
      severityBreakdown: (["low", "medium", "high", "critical"] as Severity[]).map((name) => ({ name, value: scoped.filter((t) => t.severity === name).length })),
      statusBreakdown: (["pending", "in_progress", "under_review", "resolved"] as Status[]).map((name) => ({ name, value: scoped.filter((t) => t.status === name).length })),
      recent: activity
        .filter((item) => role === "admin" || !item.task_id || tasks.find((task) => task.id === item.task_id)?.assigned_to === me.id)
        .map((item) => ({ ...item, actor: USERS.find((user) => user.id === item.user_id) ?? null, task: tasks.find((task) => task.id === item.task_id) ?? null }))
        .slice(0, 10),
    };
  }, [activity, me.id, role, tasks, visibleTasks]);

  const getTaskBundle = useCallback((id: string) => {
    const task = visibleTasks.find((item) => item.id === id);
    if (!task) return null;
    return {
      task,
      notes: notes
        .filter((item) => item.task_id === id)
        .map((item) => ({ ...item, author: USERS.find((user) => user.id === item.user_id) ?? null })),
      logs: activity
        .filter((item) => item.task_id === id)
        .map((item) => ({ ...item, actor: USERS.find((user) => user.id === item.user_id) ?? null, task }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    };
  }, [activity, notes, visibleTasks]);

  const value: StoreState = {
    role,
    setRole,
    me,
    users: USERS,
    projects,
    tasks: visibleTasks,
    visibleTasks,
    notes,
    activity,
    createProject,
    createTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
    addNote,
    getTaskBundle,
    analytics,
  };

  return <ThreatDeskContext.Provider value={value}>{children}</ThreatDeskContext.Provider>;
}

export function useThreatDesk() {
  const ctx = useContext(ThreatDeskContext);
  if (!ctx) throw new Error("useThreatDesk must be used inside ThreatDeskProvider");
  return ctx;
}
