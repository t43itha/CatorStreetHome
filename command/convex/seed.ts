import { internalMutation } from "./_generated/server";
import type { Id, TableNames } from "./_generated/dataModel";
import { demoRows } from "../src/lib/seedData.ts";
import { todayLondon } from "../src/lib/status.ts";

const DEMO_TABLES = ["clients", "properties", "tenancies", "obligations", "evidence", "reminders", "commitments", "meetings", "emails"] as const;

/** Clear demo rows and insert fresh ones dated from today. `npx convex run seed:reset` */
export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const table of DEMO_TABLES) {
      for (const row of await ctx.db.query(table).withIndex("by_demo", (q) => q.eq("isDemo", true)).collect()) {
        await ctx.db.delete(row._id);
      }
    }

    const rows = demoRows(todayLondon());
    const ids = new Map<string, Id<TableNames>>();
    const id = <T extends TableNames>(key: string) => {
      const found = ids.get(key);
      if (!found) throw new Error(`Seed references unknown key ${key}`);
      return found as Id<T>;
    };

    for (const t of rows.requirementTemplates) {
      const existing = await ctx.db.query("requirementTemplates").withIndex("by_code", (q) => q.eq("code", t.code)).unique();
      if (existing) await ctx.db.replace(existing._id, t);
      else await ctx.db.insert("requirementTemplates", t);
    }
    for (const { _id, ...c } of rows.clients) ids.set(_id, await ctx.db.insert("clients", { ...c, isDemo: true }));
    for (const { _id, clientId, ...p } of rows.properties) {
      ids.set(_id, await ctx.db.insert("properties", { ...p, clientId: id<"clients">(clientId), status: "active", area: p.postcode.startsWith("ME") ? "Kent" : "London", isDemo: true }));
    }
    for (const { _id, propertyId, ...t } of rows.tenancies) {
      const property = await ctx.db.get(id<"properties">(propertyId));
      ids.set(_id, await ctx.db.insert("tenancies", { ...t, propertyId: property!._id, clientId: property!.clientId, type: "assured_periodic", startedBefore2026Reform: t.startDate < "2026-05-01", isDemo: true }));
    }
    for (const { _id, clientId, propertyId, tenancyId, ...o } of rows.obligations) {
      ids.set(_id, await ctx.db.insert("obligations", {
        ...o, clientId: id<"clients">(clientId), propertyId: propertyId ? id<"properties">(propertyId) : undefined,
        tenancyId: tenancyId ? id<"tenancies">(tenancyId) : undefined, isDemo: true,
      }));
    }
    for (const e of rows.evidence) await ctx.db.insert("evidence", { ...e, obligationId: id<"obligations">(e.obligationId), recordedAt: Date.now(), isDemo: true });
    for (const r of rows.reminders) {
      await ctx.db.insert("reminders", { ...r, obligationId: id<"obligations">(r.obligationId), reminderKey: `${id<"obligations">(r.obligationId)}:${r.stage}`, status: "reserved", createdAt: Date.now(), isDemo: true });
    }
    for (const c of rows.commitments) await ctx.db.insert("commitments", { ...c, isDemo: true });
    for (const m of rows.meetings) await ctx.db.insert("meetings", { ...m, isDemo: true });
    for (const e of rows.emails) await ctx.db.insert("emails", { ...e, status: "needs_reply", isDemo: true });
    return { obligations: rows.obligations.length };
  },
});
