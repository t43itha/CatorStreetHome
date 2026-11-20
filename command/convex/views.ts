// Read models for each screen. All reads go through loadRows + toCommandData so status has one owner.
// NOTE: unguarded until Step 1.1b. Local only. Reads whole tables: fine at demo scale, index before live import.
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { loadRows } from "./model";
import { toCommandData, type ComplianceItem } from "../src/lib/model.ts";
import { status, type Status } from "../src/lib/status.ts";

function health(items: ComplianceItem[], today: string) {
  const counts: Record<Status, number> = { overdue: 0, urgent: 0, soon: 0, early: 0, missing: 0, current: 0, done: 0, na: 0 };
  for (const i of items) counts[status(i, today)]++;
  const applicable = items.length - counts.na;
  const worst = items.filter((i) => !i.satisfiedAt && !i.isNotApplicable)
    .map((i) => ({ i, s: status(i, today) }))
    .sort((a, b) => ["overdue", "urgent", "missing", "soon", "early", "current"].indexOf(a.s) - ["overdue", "urgent", "missing", "soon", "early", "current"].indexOf(b.s))[0];
  return { ...counts, good: counts.current + counts.done, applicable, worst: worst ? { label: worst.i.label, status: worst.s, dueDate: worst.i.dueDate } : null };
}

export const clients = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const rows = await loadRows(ctx);
    const data = toCommandData(rows, today);
    return rows.clients.map((c) => {
      const items = data.compliance.filter((i) => i.clientId === c._id);
      return {
        id: c._id, name: c.name, status: c.status, serviceTier: c.serviceTier, isOverseas: c.isOverseas,
        properties: rows.properties.filter((p) => p.clientId === c._id).length,
        health: health(items, today),
        openActions: rows.commitments.filter((k) => k.clientId === c._id && k.status !== "done").length,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const client = query({
  args: { id: v.id("clients"), today: v.string() },
  handler: async (ctx, { id, today }) => {
    const rows = await loadRows(ctx);
    const c = rows.clients.find((x) => x._id === id);
    if (!c) return null;
    const data = toCommandData(rows, today);
    const letIds = new Set(rows.tenancies.filter((t) => t.status === "active").map((t) => t.propertyId));
    const properties = rows.properties.filter((p) => p.clientId === id).map((p) => ({
      id: p._id, address: p.addressLine1, postcode: p.postcode, status: p.status, isLet: letIds.has(p._id),
      health: health(data.compliance.filter((i) => i.propertyId === p._id), today),
    }));
    const docs = data.compliance.filter((i) => i.clientId === id && i.scope === "client").map((i) => ({ ...i, status: status(i, today) }));
    const actions = (await ctx.db.query("commitments").withIndex("by_client", (q) => q.eq("clientId", id)).collect()).map((k) => ({ ...k, id: k._id }));
    const activity = (await ctx.db.query("activityLogs").withIndex("by_client", (q) => q.eq("clientId", id as Id<"clients">)).order("desc").take(8));
    return { client: (await ctx.db.get(id))!, properties, docs, actions, activity, portfolio: health(data.compliance.filter((i) => i.clientId === id), today) };
  },
});

export const properties = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const rows = await loadRows(ctx);
    const data = toCommandData(rows, today);
    const letIds = new Set(rows.tenancies.filter((t) => t.status === "active").map((t) => t.propertyId));
    return rows.properties.map((p) => {
      const c = rows.clients.find((x) => x._id === p.clientId)!;
      const t = rows.tenancies.find((x) => x.propertyId === p._id && x.status === "active");
      return {
        id: p._id, address: p.addressLine1, postcode: p.postcode, client: c.name, clientId: c._id, serviceTier: c.serviceTier, status: p.status,
        tenancy: p.status === "onboarding" ? "Onboarding" : t?.expectedEndDate ? "Notice Given" : letIds.has(p._id) ? "Let" : "Void / Marketing",
        health: health(data.compliance.filter((i) => i.propertyId === p._id), today),
      };
    }).sort((a, b) => a.address.localeCompare(b.address));
  },
});

export const property = query({
  args: { id: v.id("properties"), today: v.string() },
  handler: async (ctx, { id, today }) => {
    const rows = await loadRows(ctx);
    const p = rows.properties.find((x) => x._id === id);
    if (!p) return null;
    const data = toCommandData(rows, today);
    const items = data.compliance.filter((i) => i.propertyId === id && i.matrix);
    const doc = await ctx.db.get(id);
    return {
      property: doc!, client: rows.clients.find((c) => c._id === p.clientId)!,
      tenancy: rows.tenancies.find((t) => t.propertyId === id && t.status === "active") ?? null,
      items, health: health(items, today),
      actions: (await ctx.db.query("commitments").withIndex("by_property", (q) => q.eq("propertyId", id)).collect()).filter((k) => k.status !== "done").map((k) => ({ ...k, id: k._id })),
      activity: await ctx.db.query("activityLogs").withIndex("by_property", (q) => q.eq("propertyId", id)).order("desc").take(6),
    };
  },
});

export const actions = query({
  args: {},
  handler: async (ctx) => {
    const [clients, commitments] = await Promise.all([ctx.db.query("clients").collect(), ctx.db.query("commitments").collect()]);
    const name = new Map(clients.map((c) => [c._id, c.name]));
    return commitments.map((k) => ({ ...k, id: k._id, clientName: k.clientId ? name.get(k.clientId) : undefined }));
  },
});

export const emailCentre = query({
  args: {},
  handler: async (ctx) => {
    const reminders = await ctx.db.query("reminders").collect();
    const emails = await ctx.db.query("emails").collect();
    const drafts = reminders.filter((r) => ["reserved", "pushing", "in_outlook_drafts", "needs_attention"].includes(r.status)).sort((a, b) => b.createdAt - a.createdAt);
    const sent = reminders.filter((r) => r.status === "sent").sort((a, b) => (b.sentAt ?? 0) - (a.sentAt ?? 0));
    const obligations = await Promise.all(drafts.map((r) => (r.obligationId ? ctx.db.get(r.obligationId) : null)));
    return { drafts: drafts.map((r, i) => ({ ...r, dueDate: obligations[i]?.dueDate })), sent, threads: emails.filter((e) => e.status !== "resolved") };
  },
});

export const meetings = query({ args: {}, handler: async (ctx) => (await ctx.db.query("meetings").collect()).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)) });

export const meeting = query({
  args: { id: v.id("meetings") },
  handler: async (ctx, { id }) => {
    const m = await ctx.db.get(id);
    if (!m) return null;
    const actions = (await ctx.db.query("commitments").collect()).filter((k) => k.sourceType === "meeting" && k.sourceId === id);
    return { meeting: m, client: m.clientId ? await ctx.db.get(m.clientId) : null, actions };
  },
});

export const search = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const rows = await loadRows(ctx);
    const hits: Array<{ kind: string; label: string; sub: string; href: string }> = [];
    for (const c of rows.clients) if (`${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(needle)) hits.push({ kind: "Client", label: c.name, sub: c.serviceTier, href: `/clients/${c._id}` });
    for (const p of rows.properties) if (`${p.addressLine1} ${p.postcode}`.toLowerCase().includes(needle)) hits.push({ kind: "Property", label: p.addressLine1, sub: p.postcode, href: `/properties/${p._id}` });
    for (const t of rows.tenancies) for (const n of t.tenants ?? []) if (n.name.toLowerCase().includes(needle)) hits.push({ kind: "Tenant", label: n.name, sub: rows.properties.find((p) => p._id === t.propertyId)?.addressLine1 ?? "", href: `/properties/${t.propertyId}` });
    for (const k of rows.commitments) if (k.title.toLowerCase().includes(needle)) hits.push({ kind: "Action", label: k.title, sub: k.details ?? "", href: "/commitments" });
    for (const m of rows.meetings) if (m.title.toLowerCase().includes(needle)) hits.push({ kind: "Meeting", label: m.title, sub: m.scheduledAt.slice(0, 10), href: `/meetings/${m._id}` });
    for (const e of rows.emails) if (e.subject.toLowerCase().includes(needle)) hits.push({ kind: "Email", label: e.subject, sub: e.snippet, href: "/emails" });
    const t = new Map(rows.requirementTemplates.map((x) => [x.code, x.name]));
    for (const o of rows.obligations) {
      const label = t.get(o.templateCode) ?? "";
      if (o.propertyId && label.toLowerCase().includes(needle)) {
        const p = rows.properties.find((x) => x._id === o.propertyId);
        hits.push({ kind: "Compliance", label, sub: p?.addressLine1 ?? "", href: `/properties/${o.propertyId}` });
      }
    }
    return hits.slice(0, 20);
  },
});

/** Home "Onboarding in progress": clients and properties still onboarding, with their next step. */
export const onboardingInProgress = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const [clients, properties, obligations] = await Promise.all([ctx.db.query("clients").collect(), ctx.db.query("properties").collect(), ctx.db.query("obligations").collect()]);
    const toEnter = (pred: (o: (typeof obligations)[number]) => boolean) => obligations.filter((o) => pred(o) && !o.satisfiedAt && !o.isNotApplicable && !o.dueDate && !o.disposition).length;
    const days = (from?: string) => (from ? Math.max(0, Math.round((Date.parse(today) - Date.parse(from)) / 864e5)) : 0);
    const items: Array<{ kind: "client" | "property"; id: string; href: string; name: string; sub: string; step: string; days: number }> = [];
    for (const c of clients.filter((x) => x.status === "onboarding")) {
      const props = properties.filter((p) => p.clientId === c._id);
      const docs = toEnter((o) => o.clientId === c._id && !o.propertyId);
      const step = docs ? "Landlord documents" : props.length === 0 || props.some((p) => toEnter((o) => o.propertyId === p._id)) ? "Properties" : "Review & activate";
      items.push({ kind: "client", id: c._id, href: `/clients/${c._id}/onboarding`, name: c.name, sub: `${props.length} propert${props.length === 1 ? "y" : "ies"}`, step, days: days(c.onboardingStartedAt) });
    }
    for (const p of properties.filter((x) => x.status === "onboarding")) {
      const c = clients.find((x) => x._id === p.clientId);
      if (!c || c.status === "onboarding") continue;
      items.push({ kind: "property", id: p._id, href: `/properties/${p._id}`, name: p.addressLine1, sub: c.name, step: toEnter((o) => o.propertyId === p._id) ? "Compliance" : "Review & activate", days: days(p.onboardingStartedAt) });
    }
    return items;
  },
});
