// Demo data: Settings → Reset / Clear (plan Screen 7). NOTE: unguarded until Step 1.1b (owner-only then). Local only.
import { mutation } from "./_generated/server";
import type { Id, TableNames } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { demoRows } from "../src/lib/seedData.ts";
import { TEMPLATES } from "../src/lib/templates.ts";
import { today } from "./model";

const DEMO_TABLES = ["clients", "properties", "tenancies", "obligations", "evidence", "reminders", "commitments", "meetings", "emails"] as const;

export async function clearDemo(ctx: MutationCtx) {
  for (const table of DEMO_TABLES) {
    for (const row of await ctx.db.query(table).withIndex("by_demo", (q) => q.eq("isDemo", true)).collect()) await ctx.db.delete(row._id);
  }
}

export async function ensureTemplates(ctx: MutationCtx) {
  for (const t of TEMPLATES) {
    const existing = await ctx.db.query("requirementTemplates").withIndex("by_code", (q) => q.eq("code", t.code)).unique();
    if (existing) await ctx.db.replace(existing._id, t);
    else await ctx.db.insert("requirementTemplates", t);
  }
}

export async function seedDemo(ctx: MutationCtx) {
  await clearDemo(ctx);
  await ensureTemplates(ctx);
  const rows = demoRows(today());
  const ids = new Map<string, Id<TableNames>>();
  const id = <T extends TableNames>(key: string) => {
    const found = ids.get(key);
    if (!found) throw new Error(`Seed references unknown key ${key}`);
    return found as Id<T>;
  };
  const opt = <T extends TableNames>(key?: string) => (key ? id<T>(key) : undefined);
  const isDemo = true;

  for (const { _id, ...c } of rows.clients) ids.set(_id, await ctx.db.insert("clients", { ...c, isDemo }));
  for (const { _id, clientId, ...p } of rows.properties) {
    ids.set(_id, await ctx.db.insert("properties", { ...p, clientId: id<"clients">(clientId), status: p.status ?? "active", hasGas: p.hasGas ?? true, licenceType: p.licenceType ?? "none", area: /^(ME|CT|TN|DA)\d/.test(p.postcode) ? "Kent" : "London", isDemo }));
  }
  for (const { _id, propertyId, ...t } of rows.tenancies) {
    const property = (await ctx.db.get(id<"properties">(propertyId)))!;
    ids.set(_id, await ctx.db.insert("tenancies", { ...t, tenants: t.tenants ?? [], propertyId: property._id, clientId: property.clientId, type: "assured_periodic", startedBefore2026Reform: t.startDate < "2026-05-01", isDemo }));
  }
  for (const { _id, clientId, propertyId, tenancyId, ...o } of rows.obligations) {
    ids.set(_id, await ctx.db.insert("obligations", { ...o, clientId: id<"clients">(clientId), propertyId: opt<"properties">(propertyId), tenancyId: opt<"tenancies">(tenancyId), isDemo }));
  }
  for (const e of rows.evidence) await ctx.db.insert("evidence", { ...e, obligationId: id<"obligations">(e.obligationId), recordedAt: Date.now(), isDemo });
  for (const { _id, obligationId, ...r } of rows.reminders) {
    const oid = opt<"obligations">(obligationId);
    const o = oid ? await ctx.db.get(oid) : null;
    ids.set(_id, await ctx.db.insert("reminders", { ...r, obligationId: oid, clientId: o?.clientId, reminderKey: `${oid}:${r.stage}`, status: "reserved", createdAt: Date.now(), isDemo }));
  }
  for (const { _id, clientId, propertyId, ...c } of rows.commitments) ids.set(_id, await ctx.db.insert("commitments", { ...c, clientId: opt<"clients">(clientId), propertyId: opt<"properties">(propertyId), isDemo }));
  for (const { _id, clientId, ...m } of rows.meetings) ids.set(_id, await ctx.db.insert("meetings", { ...m, clientId: opt<"clients">(clientId), isDemo }));
  for (const { _id, ...e } of rows.emails) ids.set(_id, await ctx.db.insert("emails", { ...e, status: "needs_reply", isDemo }));
  return { obligations: rows.obligations.length };
}

export const reset = mutation({ args: {}, handler: (ctx) => seedDemo(ctx) });
export const clear = mutation({ args: {}, handler: async (ctx) => { await clearDemo(ctx); await ensureTemplates(ctx); } });
