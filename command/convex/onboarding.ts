// Onboarding is a view over ordinary records (plan Screen 2b, shape B): progress is derived, never stored.
// NOTE: unguarded until Step 1.1b. Local only.
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getSettings, logActivity, today } from "./model";
import { isUrgent, addDays } from "../src/lib/status.ts";
import { TEMPLATE } from "../src/lib/templates.ts";
import { render } from "../src/lib/emailTemplates.ts";

type O = Doc<"obligations">;
const open = (o: O) => !o.satisfiedAt && !o.isNotApplicable;
const stillToEnter = (o: O) => open(o) && !o.dueDate && !o.disposition;

async function scopeOf(ctx: QueryCtx, clientId: Id<"clients">) {
  const client = await ctx.db.get(clientId);
  if (!client) throw new Error("Client not found");
  const properties = await ctx.db.query("properties").withIndex("by_client", (q) => q.eq("clientId", clientId)).collect();
  const obligations = await ctx.db.query("obligations").withIndex("by_client", (q) => q.eq("clientId", clientId)).collect();
  const tenancies = (await Promise.all(properties.map((p) => ctx.db.query("tenancies").withIndex("by_property", (q) => q.eq("propertyId", p._id)).collect()))).flat();
  return { client, properties, obligations, tenancies };
}

const label = (o: O) => TEMPLATE.get(o.templateCode)?.name ?? o.templateCode;

export const progress = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const { client, properties, obligations, tenancies } = await scopeOf(ctx, clientId);
    const on = today();
    const let_ = new Set(tenancies.filter((t) => t.status === "active").map((t) => t.propertyId));
    const clientDocs = obligations.filter((o) => !o.propertyId);
    const docsLeft = clientDocs.filter(stillToEnter).length;
    const perProperty = properties.map((p) => {
      const os = obligations.filter((o) => o.propertyId === p._id);
      return {
        propertyId: p._id, address: `${p.addressLine1}, ${p.postcode}`, status: p.status, isLet: let_.has(p._id),
        done: os.filter((o) => o.satisfiedAt).length,
        overdue: os.filter((o) => isUrgent(o, on, { isStatutory: TEMPLATE.get(o.templateCode)?.isStatutory ?? false, propertyLet: let_.has(p._id) })).length,
        missing: os.filter(stillToEnter).length,
        requested: os.filter((o) => open(o) && o.disposition === "request_from_landlord").length,
        obligations: os.map((o) => ({ id: o._id, templateCode: o.templateCode, label: label(o), tenancy: !!o.tenancyId, dueDate: o.dueDate, satisfiedAt: o.satisfiedAt, isNotApplicable: o.isNotApplicable, naReason: o.naReason, disposition: o.disposition })),
      };
    });
    const urgent = obligations.filter((o) => {
      const t = TEMPLATE.get(o.templateCode);
      return t && isUrgent(o, on, { isStatutory: t.isStatutory, propertyLet: !!o.propertyId && let_.has(o.propertyId) });
    }).map((o) => ({ obligationId: o._id, label: label(o), dueDate: o.dueDate, address: properties.find((p) => p._id === o.propertyId)?.addressLine1 }));
    const requestList = obligations.filter((o) => open(o) && o.disposition === "request_from_landlord")
      .map((o) => ({ obligationId: o._id, label: label(o), propertyAddress: properties.find((p) => p._id === o.propertyId)?.addressLine1 }));
    return {
      client,
      clientDocs: clientDocs.map((o) => ({ id: o._id, label: label(o), satisfiedAt: o.satisfiedAt, isNotApplicable: o.isNotApplicable, naReason: o.naReason, disposition: o.disposition })),
      steps: [
        { key: "landlord", state: "done" },
        { key: "documents", state: docsLeft === 0 ? "done" : docsLeft < clientDocs.length ? "partial" : "todo" },
        { key: "properties", state: properties.length === 0 ? "todo" : perProperty.every((p) => p.missing === 0) ? "done" : "partial" },
        { key: "review", state: client.status === "onboarding" ? "todo" : "done" },
      ] as const,
      properties: perProperty,
      urgent,
      requestList,
      totals: { obligations: obligations.length, done: obligations.filter((o) => o.satisfiedAt).length, requested: requestList.length, stillToEnter: obligations.filter(stillToEnter).length, urgent: urgent.length },
    };
  },
});

/** One request email and one Action for everything marked "Request from landlord" in this scope. */
async function requestOnce(ctx: MutationCtx, client: Doc<"clients">, key: string, items: Array<{ id: Id<"obligations">; text: string }>, propertyId?: Id<"properties">) {
  if (!items.length) return {};
  const reminderKey = `${key}:onboarding_request`;
  const existing = await ctx.db.query("reminders").withIndex("by_key", (q) => q.eq("reminderKey", reminderKey)).unique();
  if (existing) return { reminderId: existing._id };
  const { templates } = await getSettings(ctx);
  const fields = { landlord: client.name.split(" ")[0], items: items.map((i) => `• ${i.text}`).join("\n") };
  const reminderId = await ctx.db.insert("reminders", {
    reminderKey, clientId: client._id, stage: "onboarding_request", status: "reserved", to: client.name, toEmail: client.email,
    subject: render(templates.onboarding_request.subject, fields), body: render(templates.onboarding_request.body, fields), createdAt: Date.now(), isDemo: client.isDemo,
  });
  const actionId = await ctx.db.insert("commitments", {
    title: `Documents from ${client.name}`, details: items.map((i) => i.text).join(" · "), clientId: client._id, propertyId,
    ownerType: "landlord", waitingOn: client.name, dueDate: addDays(today(), 7), lastChasedAt: today(), status: "waiting", sourceType: "compliance", isDemo: client.isDemo,
  });
  return { reminderId, actionId };
}

export const activate = mutation({
  args: { clientId: v.id("clients"), draftRequestEmail: v.boolean() },
  handler: async (ctx, { clientId, draftRequestEmail }) => {
    const { client, properties, obligations } = await scopeOf(ctx, clientId);
    await ctx.db.patch(clientId, { status: "active", activatedAt: today() });
    for (const p of properties) if (p.status === "onboarding") await ctx.db.patch(p._id, { status: "active" });
    const items = obligations.filter((o) => open(o) && o.disposition === "request_from_landlord")
      .map((o) => ({ id: o._id, text: `${label(o)}${o.propertyId ? ` · ${properties.find((p) => p._id === o.propertyId)?.addressLine1}` : ""}` }));
    const result = draftRequestEmail ? await requestOnce(ctx, client, clientId, items) : {};
    await logActivity(ctx, { entityType: "client", entityId: clientId, clientId, action: "activated", summary: `${client.name} is active` });
    return result;
  },
});

export const activateProperty = mutation({
  args: { propertyId: v.id("properties"), draftRequestEmail: v.boolean() },
  handler: async (ctx, { propertyId, draftRequestEmail }) => {
    const p = await ctx.db.get(propertyId);
    if (!p) throw new Error("Property not found");
    const client = (await ctx.db.get(p.clientId))!;
    await ctx.db.patch(propertyId, { status: "active" });
    const os = await ctx.db.query("obligations").withIndex("by_property", (q) => q.eq("propertyId", propertyId)).collect();
    const items = os.filter((o) => open(o) && o.disposition === "request_from_landlord").map((o) => ({ id: o._id, text: `${label(o)} · ${p.addressLine1}` }));
    return draftRequestEmail ? await requestOnce(ctx, client, propertyId, items, propertyId) : {};
  },
});

/** Discard is only possible while onboarding and before any evidence exists (audit trail). */
export const discard = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const { client, properties, obligations, tenancies } = await scopeOf(ctx, clientId);
    if (client.status !== "onboarding") throw new Error("Only a client still in onboarding can be discarded. Set the status to Former instead.");
    for (const o of obligations) if (await ctx.db.query("evidence").withIndex("by_obligation", (q) => q.eq("obligationId", o._id)).first()) throw new Error("Evidence has been recorded, so this client can't be discarded");
    for (const row of [...obligations, ...tenancies, ...properties]) await ctx.db.delete(row._id);
    for (const r of await ctx.db.query("reminders").collect()) if (r.clientId === clientId) await ctx.db.delete(r._id);
    for (const c of await ctx.db.query("commitments").withIndex("by_client", (q) => q.eq("clientId", clientId)).collect()) await ctx.db.delete(c._id);
    await ctx.db.delete(clientId);
  },
});
