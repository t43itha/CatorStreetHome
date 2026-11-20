// NOTE: unguarded until Step 1.1b. Local only.
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { licenceType } from "./schema";
import { insertObligations, logActivity, today } from "./model";
import { propertyObligations, type LicenceType } from "../src/lib/templates.ts";

const key = (s: string) => s.toUpperCase().replace(/\s+/g, "");
const line = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export async function possibleDuplicates(ctx: QueryCtx, q: { postcode: string; addressLine1: string }) {
  const all = await ctx.db.query("properties").collect();
  const hits = all.filter((p) => key(p.postcode) === key(q.postcode) && line(p.addressLine1).startsWith(line(q.addressLine1).slice(0, 12)));
  return Promise.all(hits.map(async (p) => ({ propertyId: p._id, clientId: p.clientId, clientName: (await ctx.db.get(p.clientId))?.name ?? "", address: `${p.addressLine1}, ${p.postcode}` })));
}

export const findPossibleDuplicates = query({
  args: { postcode: v.string(), addressLine1: v.string() },
  handler: (ctx, q) => possibleDuplicates(ctx, q),
});

/** Kent for Medway and Kent postcodes, London otherwise (editable later). */
export const areaFor = (postcode: string): "London" | "Kent" => (/^(ME|CT|TN|DA)\d/i.test(postcode.trim()) ? "Kent" : "London");

export async function addProperty(ctx: MutationCtx, a: { clientId: Id<"clients">; addressLine1: string; postcode: string; hasGas: boolean; licenceType: LicenceType; oneDriveFolderUrl?: string }) {
  if (!a.addressLine1.trim() || !a.postcode.trim()) throw new Error("Enter the address and postcode");
  const propertyId = await ctx.db.insert("properties", {
    ...a, addressLine1: a.addressLine1.trim(), postcode: a.postcode.trim().toUpperCase(), area: areaFor(a.postcode),
    status: "onboarding", onboardingStartedAt: today(), isDemo: false,
  });
  await insertObligations(ctx, { clientId: a.clientId, propertyId }, propertyObligations(a));
  await logActivity(ctx, { entityType: "property", entityId: propertyId, clientId: a.clientId, propertyId, action: "created", summary: `Property added: ${a.addressLine1.trim()}` });
  return propertyId;
}

/** New properties start in `onboarding`, so reminders wait until the property is activated. */
export const add = mutation({
  args: { clientId: v.id("clients"), addressLine1: v.string(), postcode: v.string(), hasGas: v.boolean(), licenceType, oneDriveFolderUrl: v.optional(v.string()) },
  handler: (ctx, a) => addProperty(ctx, a),
});

/** Changing a flag re-runs applicability: N/A ↔ required (plan Screen 2b). */
export const updateFlags = mutation({
  args: { id: v.id("properties"), hasGas: v.optional(v.boolean()), licenceType: v.optional(licenceType) },
  handler: async (ctx, { id, ...flags }) => {
    const p = await ctx.db.get(id);
    if (!p) throw new Error("Property not found");
    await ctx.db.patch(id, flags);
    const next = { ...p, ...flags };
    const drafts = propertyObligations(next);
    const existing = (await ctx.db.query("obligations").withIndex("by_property", (q) => q.eq("propertyId", id)).collect()).filter((o) => !o.tenancyId && !o.satisfiedAt);
    for (const d of drafts) {
      const o = existing.find((e) => e.templateCode === d.templateCode);
      if (o) await ctx.db.patch(o._id, { isNotApplicable: d.isNotApplicable, naReason: d.naReason });
    }
  },
});
