// NOTE: unguarded until Step 1.1b. Local only.
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { insertObligations, logActivity } from "./model";
import { startedBefore2026Reform, tenancyObligations } from "../src/lib/templates.ts";

export interface TenancyInput {
  propertyId: Id<"properties">; tenants: Array<{ name: string; email?: string }>; startDate: string;
  rentGbp?: number; depositAmountGbp?: number; depositReceivedDate?: string; depositScheme?: string;
}

/** Every tenancy is assured periodic (no end date) since 1 May 2026. */
export async function startTenancy(ctx: MutationCtx, a: TenancyInput) {
  const p = await ctx.db.get(a.propertyId);
  if (!p) throw new Error("Property not found");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.startDate)) throw new Error("Enter the tenancy start date");
  for (const t of await ctx.db.query("tenancies").withIndex("by_property", (q) => q.eq("propertyId", a.propertyId)).collect()) {
    if (t.status === "active") await ctx.db.patch(t._id, { status: "ended" });
  }
  const tenancyId = await ctx.db.insert("tenancies", {
    ...a, clientId: p.clientId, status: "active", type: "assured_periodic", startedBefore2026Reform: startedBefore2026Reform(a.startDate), isDemo: false,
  });
  await insertObligations(ctx, { clientId: p.clientId, propertyId: a.propertyId, tenancyId }, tenancyObligations(a));
  await logActivity(ctx, { entityType: "tenancy", entityId: tenancyId, clientId: p.clientId, propertyId: a.propertyId, action: "started", summary: `Tenancy started ${a.startDate}` });
  return tenancyId;
}

export const start = mutation({
  args: {
    propertyId: v.id("properties"), tenants: v.array(v.object({ name: v.string(), email: v.optional(v.string()) })), startDate: v.string(),
    rentGbp: v.optional(v.number()), depositAmountGbp: v.optional(v.number()), depositReceivedDate: v.optional(v.string()), depositScheme: v.optional(v.string()),
  },
  handler: (ctx, a) => startTenancy(ctx, a),
});
