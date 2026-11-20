// Shared write and read helpers. Every mutation, the importer, onboarding and the seed go through
// these, so each task has one way to happen (plan Screen 2b "same mutations the rest of the app use").
import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Rows } from "../src/lib/model.ts";
import { diffCalendarDays, formatDue, formatShortDate, todayLondon } from "../src/lib/status.ts";
import { nextObligations, type EvidenceInput } from "../src/lib/rules.ts";
import { reminderStage, TEMPLATE, type ObligationDraft } from "../src/lib/templates.ts";
import { DEFAULT_CADENCE, DEFAULT_JOBS, DEFAULT_TEMPLATES, render, type CadenceSettings, type EmailStage, type EmailTemplate, type JobSettings } from "../src/lib/emailTemplates.ts";

export const today = () => todayLondon();

export async function loadRows(ctx: QueryCtx): Promise<Rows> {
  const [clients, properties, tenancies, requirementTemplates, obligations, evidence, reminders, commitments, meetings, emails] = await Promise.all([
    ctx.db.query("clients").collect(), ctx.db.query("properties").collect(), ctx.db.query("tenancies").collect(),
    ctx.db.query("requirementTemplates").collect(), ctx.db.query("obligations").collect(), ctx.db.query("evidence").collect(),
    ctx.db.query("reminders").collect(), ctx.db.query("commitments").collect(), ctx.db.query("meetings").collect(), ctx.db.query("emails").collect(),
  ]);
  return { clients, properties, tenancies, requirementTemplates, obligations, evidence, reminders, commitments, meetings, emails };
}

/** The actor always comes from the signed-in user on the server, never from arguments (plan §8.3). */
export async function logActivity(ctx: MutationCtx & { user?: Doc<"users"> }, a: { entityType: string; entityId: string; clientId?: Id<"clients">; propertyId?: Id<"properties">; action: string; summary: string; isDemo?: boolean }) {
  await ctx.db.insert("activityLogs", { ...a, actorUserId: ctx.user?._id, actorName: ctx.user?.name ?? ctx.user?.email, isDemo: a.isDemo ?? false, createdAt: Date.now() });
}

/** Default responsibility from the service tier (plan §4 Screen 3). Insurance is always the landlord's. */
export function responsibilityFor(client: Pick<Doc<"clients">, "serviceTier">, templateCode: string): "CSPS" | "Landlord" {
  if (templateCode === "insurance") return "Landlord";
  return client.serviceTier.startsWith("Full Management") ? "CSPS" : "Landlord";
}

/** Insert obligations once per (template, scope); re-running is a no-op for codes already present. */
export async function insertObligations(
  ctx: MutationCtx,
  scope: { clientId: Id<"clients">; propertyId?: Id<"properties">; tenancyId?: Id<"tenancies"> },
  drafts: ObligationDraft[],
  isDemo = false,
): Promise<Id<"obligations">[]> {
  const client = (await ctx.db.get(scope.clientId))!;
  const existing = scope.tenancyId
    ? await ctx.db.query("obligations").withIndex("by_tenancy", (q) => q.eq("tenancyId", scope.tenancyId)).collect()
    : scope.propertyId
      ? (await ctx.db.query("obligations").withIndex("by_property", (q) => q.eq("propertyId", scope.propertyId)).collect()).filter((o) => !o.tenancyId)
      : (await ctx.db.query("obligations").withIndex("by_client", (q) => q.eq("clientId", scope.clientId)).collect()).filter((o) => !o.propertyId);
  const open = new Set(existing.filter((o) => !o.satisfiedAt).map((o) => o.templateCode));
  const ids: Id<"obligations">[] = [];
  for (const d of drafts) {
    if (open.has(d.templateCode)) continue;
    if (!TEMPLATE.has(d.templateCode)) throw new ConvexError(`Unknown requirement: ${d.templateCode}`);
    ids.push(await ctx.db.insert("obligations", { ...scope, ...d, responsibility: responsibilityFor(client, d.templateCode), isDemo }));
  }
  return ids;
}

/** Record evidence: satisfies one obligation and opens whatever comes next (plan §5.1). */
export async function recordEvidence(ctx: MutationCtx, obligationId: Id<"obligations">, input: EvidenceInput & { oneDriveFileName?: string; notes?: string }) {
  const o = await ctx.db.get(obligationId);
  if (!o) throw new ConvexError("Obligation not found");
  if (o.satisfiedAt || o.isNotApplicable) throw new ConvexError("This item is already closed");
  const t = TEMPLATE.get(o.templateCode);
  if (!t) throw new ConvexError(`Unknown requirement: ${o.templateCode}`);
  const evidenceId = await ctx.db.insert("evidence", { obligationId, ...input, recordedAt: Date.now(), isDemo: o.isDemo });
  await ctx.db.patch(obligationId, { satisfiedAt: input.issueDate && input.issueDate <= today() ? input.issueDate : today(), disposition: undefined });
  const next = nextObligations({ templateCode: o.templateCode, kind: t.kind }, input);
  for (const n of next) {
    await ctx.db.insert("obligations", {
      templateCode: n.templateCode, clientId: o.clientId, propertyId: o.propertyId, tenancyId: o.tenancyId, parentObligationId: obligationId,
      dueDate: n.dueDate, isNotApplicable: false, responsibility: o.responsibility, isDemo: o.isDemo,
    });
  }
  await logActivity(ctx, { entityType: "obligation", entityId: obligationId, clientId: o.clientId, propertyId: o.propertyId, action: "evidence_recorded", summary: `${t.name} recorded${next.length ? ` · ${next.length} next item${next.length > 1 ? "s" : ""} opened` : ""}`, isDemo: o.isDemo });
  return { evidenceId, opened: next.length };
}

// ---- Settings ----

export async function getSettings(ctx: QueryCtx): Promise<{ cadence: CadenceSettings; templates: Record<EmailStage, EmailTemplate>; jobs: JobSettings }> {
  const rows = await ctx.db.query("settings").collect();
  const get = (key: string) => rows.find((r) => r.key === key)?.value;
  return {
    cadence: { ...DEFAULT_CADENCE, ...(get("cadence") ?? {}) },
    templates: { ...DEFAULT_TEMPLATES, ...(get("templates") ?? {}) },
    jobs: { ...DEFAULT_JOBS, ...(get("jobs") ?? {}) },
  };
}

// ---- Reminder outbox (plan §5.4) ----

/**
 * Reserve one reminder per (obligation, stage) that has been reached. Convex mutations are
 * transactions, so two overlapping scans can't both insert the same key. Clients or properties
 * still in onboarding are skipped: they get one request email at activation instead.
 */
export async function reserveDue(ctx: MutationCtx, on: string) {
  const { cadence, templates } = await getSettings(ctx);
  const [obligations, clients, properties, tenancies] = await Promise.all([
    ctx.db.query("obligations").collect(), ctx.db.query("clients").collect(), ctx.db.query("properties").collect(), ctx.db.query("tenancies").collect(),
  ]);
  const client = new Map(clients.map((c) => [c._id, c]));
  const property = new Map(properties.map((p) => [p._id, p]));
  const let_ = new Set(tenancies.filter((t) => t.status === "active").map((t) => t.propertyId));
  const ended = new Set(tenancies.filter((t) => t.status === "ended").map((t) => t._id));
  let reserved = 0;
  for (const o of obligations) {
    if (o.tenancyId && ended.has(o.tenancyId)) continue;
    const c = client.get(o.clientId);
    const p = o.propertyId ? property.get(o.propertyId) : undefined;
    if (!c || c.status === "onboarding" || c.status === "former" || p?.status === "onboarding") continue;
    const t = TEMPLATE.get(o.templateCode);
    if (!t) continue;
    const stage = reminderStage(o, on, { isStatutory: t.isStatutory, propertyLet: p ? let_.has(p._id) : false });
    if (!stage || !cadence.stages.includes(stage)) continue;
    const reminderKey = `${o._id}:${stage}`;
    if (await ctx.db.query("reminders").withIndex("by_key", (q) => q.eq("reminderKey", reminderKey)).unique()) continue;
    const address = p ? `${p.addressLine1}, ${p.postcode}` : c.name;
    const fields = {
      landlord: c.name.split(" ")[0], item: t.name, address,
      dueDate: o.dueDate ? formatShortDate(o.dueDate) : "", daysText: o.dueDate ? formatDue(diffCalendarDays(o.dueDate, on)) : "",
    };
    const tpl = templates[stage];
    await ctx.db.insert("reminders", {
      reminderKey, obligationId: o._id, clientId: c._id, stage, status: "reserved",
      to: `${c.name} · ${p ? p.addressLine1 : "client documents"}`, toEmail: c.email,
      subject: render(tpl.subject, fields), body: render(tpl.body, fields), createdAt: Date.now(), isDemo: o.isDemo,
    });
    reserved++;
  }
  return { reserved };
}
