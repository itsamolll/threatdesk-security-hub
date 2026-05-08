// All ThreatDesk server functions in one place. Each function authenticates
// via Clerk + syncs the user, then queries Supabase with the service role.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin, requireUser } from "./auth-server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- Shared validators ----------
const SeverityEnum = z.enum(["low", "medium", "high", "critical"]);
const PriorityEnum = z.enum(["low", "medium", "high", "critical"]);
const StatusEnum = z.enum(["pending", "in_progress", "under_review", "resolved", "overdue"]);

// ---------- Identity ----------
export const getMe = createServerFn({ method: "GET" }).handler(async () => {
  return await requireUser();
});

// ---------- Projects ----------
export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Response(error.message, { status: 500 });
  return data ?? [];
});

export const createProject = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(2).max(120),
      description: z.string().trim().max(2000).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("projects")
      .insert({ name: data.name, description: data.description, created_by: admin.id })
      .select()
      .single();
    if (error) throw new Response(error.message, { status: 500 });
    return row;
  });

// ---------- Users / Team ----------
export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Response(error.message, { status: 500 });
  return data ?? [];
});

// ---------- Tasks ----------
export const listTasks = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();
  let q = supabaseAdmin
    .from("tasks")
    .select(
      `id, title, description, category, severity, priority, status, due_date, created_at, updated_at,
       project:projects(id, name),
       assignee:users!tasks_assigned_to_fkey(id, name, email)`,
    )
    .order("created_at", { ascending: false });
  if (me.role === "member") q = q.eq("assigned_to", me.id);
  const { data, error } = await q;
  if (error) throw new Response(error.message, { status: 500 });
  return data ?? [];
});

export const getTask = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireUser();
    const { data: task, error } = await supabaseAdmin
      .from("tasks")
      .select(
        `id, title, description, category, severity, priority, status, due_date, created_at, updated_at,
         project:projects(id, name),
         assignee:users!tasks_assigned_to_fkey(id, name, email),
         creator:users!tasks_created_by_fkey(id, name)`,
      )
      .eq("id", data.id)
      .single();
    if (error || !task) throw new Response("Task not found", { status: 404 });
    if (me.role === "member" && task.assignee?.id !== me.id) {
      throw new Response("Forbidden", { status: 403 });
    }
    const { data: notes } = await supabaseAdmin
      .from("task_notes")
      .select("id, note, created_at, author:users(id, name)")
      .eq("task_id", data.id)
      .order("created_at", { ascending: true });
    const { data: logs } = await supabaseAdmin
      .from("activity_logs")
      .select("id, action, created_at, actor:users(id, name)")
      .eq("task_id", data.id)
      .order("created_at", { ascending: false })
      .limit(20);
    return { task, notes: notes ?? [], logs: logs ?? [] };
  });

export const createTask = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      title: z.string().trim().min(3).max(160),
      description: z.string().trim().max(4000).optional().default(""),
      category: z.string().trim().min(2).max(80),
      severity: SeverityEnum,
      priority: PriorityEnum,
      project_id: z.string().uuid().nullable().optional(),
      assigned_to: z.string().uuid().nullable().optional(),
      due_date: z.string().min(8).max(20),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        priority: data.priority,
        project_id: data.project_id ?? null,
        assigned_to: data.assigned_to ?? null,
        due_date: data.due_date,
        created_by: admin.id,
      })
      .select()
      .single();
    if (error) throw new Response(error.message, { status: 500 });
    await supabaseAdmin.from("activity_logs").insert({
      task_id: row.id,
      user_id: admin.id,
      action: `Created task "${row.title}"`,
    });
    return row;
  });

export const updateTaskStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: StatusEnum }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireUser();
    // Members can only update their own tasks
    if (me.role === "member") {
      const { data: t } = await supabaseAdmin
        .from("tasks")
        .select("assigned_to")
        .eq("id", data.id)
        .single();
      if (!t || t.assigned_to !== me.id) throw new Response("Forbidden", { status: 403 });
    }
    const { data: row, error } = await supabaseAdmin
      .from("tasks")
      .update({ status: data.status })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Response(error.message, { status: 500 });
    await supabaseAdmin.from("activity_logs").insert({
      task_id: row.id,
      user_id: me.id,
      action: `Status changed to ${data.status.replace("_", " ")}`,
    });
    return row;
  });

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("tasks").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const addNote = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ task_id: z.string().uuid(), note: z.string().trim().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireUser();
    if (me.role === "member") {
      const { data: t } = await supabaseAdmin
        .from("tasks")
        .select("assigned_to")
        .eq("id", data.task_id)
        .single();
      if (!t || t.assigned_to !== me.id) throw new Response("Forbidden", { status: 403 });
    }
    const { data: row, error } = await supabaseAdmin
      .from("task_notes")
      .insert({ task_id: data.task_id, user_id: me.id, note: data.note })
      .select("id, note, created_at, author:users(id, name)")
      .single();
    if (error) throw new Response(error.message, { status: 500 });
    await supabaseAdmin.from("activity_logs").insert({
      task_id: data.task_id,
      user_id: me.id,
      action: "Added investigation note",
    });
    return row;
  });

// ---------- Analytics ----------
export const getAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();
  const scope = me.role === "member" ? { assigned_to: me.id } : null;

  let baseQ = supabaseAdmin.from("tasks").select("status, severity, due_date, assigned_to");
  if (scope) baseQ = baseQ.eq("assigned_to", scope.assigned_to);
  const { data: tasks, error } = await baseQ;
  if (error) throw new Response(error.message, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: tasks?.length ?? 0,
    resolved: tasks?.filter((t) => t.status === "resolved").length ?? 0,
    in_progress: tasks?.filter((t) => t.status === "in_progress").length ?? 0,
    pending: tasks?.filter((t) => t.status === "pending").length ?? 0,
    under_review: tasks?.filter((t) => t.status === "under_review").length ?? 0,
    critical: tasks?.filter((t) => t.severity === "critical").length ?? 0,
    overdue:
      tasks?.filter(
        (t) => t.due_date && t.due_date < today && t.status !== "resolved",
      ).length ?? 0,
  };

  const severityBreakdown = ["low", "medium", "high", "critical"].map((s) => ({
    name: s,
    value: tasks?.filter((t) => t.severity === s).length ?? 0,
  }));
  const statusBreakdown = ["pending", "in_progress", "under_review", "resolved"].map((s) => ({
    name: s,
    value: tasks?.filter((t) => t.status === s).length ?? 0,
  }));

  const { data: recent } = await supabaseAdmin
    .from("activity_logs")
    .select("id, action, created_at, actor:users(name), task:tasks(title)")
    .order("created_at", { ascending: false })
    .limit(8);

  return { stats, severityBreakdown, statusBreakdown, recent: recent ?? [] };
});

// ---------- Admin actions ----------
export const assignTask = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), assigned_to: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("tasks")
      .update({ assigned_to: data.assigned_to })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Response(error.message, { status: 500 });
    await supabaseAdmin.from("activity_logs").insert({
      task_id: row.id,
      user_id: admin.id,
      action: data.assigned_to ? "Reassigned task" : "Unassigned task",
    });
    return row;
  });
