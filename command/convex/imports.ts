// Bulk import (plan Screen 7). Row by row through the same helpers onboarding uses.
// Imported clients and properties start in `onboarding`, so no reminder drafts until each is activated.
import { v } from "convex/values";
import { ownerMutation } from "./lib/functions";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { createClient, possibleDuplicates as clientDuplicates } from "./clients";
import { addProperty, possibleDuplicates as propertyDuplicates } from "./properties";
import { startTenancy } from "./tenancies";
import { insertObligations } from "./model";

const iso = v.optional(v.string());
const row = v.object({
  landlord: v.string(), email: v.optional(v.string()), phone: v.optional(v.string()), tier: v.string(), overseas: v.boolean(),
  address: v.string(), postcode: v.string(), hasGas: v.boolean(), licence: v.union(v.literal("none"), v.literal("selective"), v.literal("additional"), v.literal("hmo")),
  tenant: v.optional(v.string()), tenancyStart: iso, depositReceived: iso,
  gasExpiry: iso, eicrExpiry: iso, epcExpiry: iso, insuranceRenewal: iso, licenceExpiry: iso, rtrTimeLimited: v.boolean(), rtrFollowUp: iso,
});

/** The open obligation's due date is the current certificate's expiry. */
async function setDue(ctx: MutationCtx, propertyId: Id<"properties">, templateCode: string, dueDate?: string) {
  if (!dueDate) return;
  const o = (await ctx.db.query("obligations").withIndex("by_property", (q) => q.eq("propertyId", propertyId)).collect())
    .find((x) => x.templateCode === templateCode && !x.satisfiedAt);
  if (o) await ctx.db.patch(o._id, { dueDate, isNotApplicable: false, naReason: undefined });
}

export const commit = ownerMutation({
  args: { rows: v.array(row) },
  handler: async (ctx, { rows }) => {
    const result = { clients: 0, properties: 0, tenancies: 0, skipped: [] as string[] };
    const created = new Map<string, Id<"clients">>();
    for (const r of rows) {
      const key = (r.email || r.landlord).toLowerCase();
      let clientId = created.get(key);
      if (!clientId) {
        const match = (await clientDuplicates(ctx, { email: r.email, name: r.landlord })).find((d) => d.matchedOn !== "phone");
        clientId = match?.clientId ?? await createClient(ctx, { name: r.landlord, email: r.email, phone: r.phone, serviceTier: r.tier, isOverseas: r.overseas });
        if (!match) result.clients++;
        created.set(key, clientId);
      }
      if ((await propertyDuplicates(ctx, { postcode: r.postcode, addressLine1: r.address })).length) {
        result.skipped.push(`${r.address}, ${r.postcode} (already on file)`);
        continue;
      }
      const propertyId = await addProperty(ctx, { clientId, addressLine1: r.address, postcode: r.postcode, hasGas: r.hasGas, licenceType: r.licence });
      result.properties++;
      await setDue(ctx, propertyId, "gas", r.gasExpiry);
      await setDue(ctx, propertyId, "eicr", r.eicrExpiry);
      await setDue(ctx, propertyId, "epc", r.epcExpiry);
      await setDue(ctx, propertyId, "insurance", r.insuranceRenewal);
      await setDue(ctx, propertyId, "licence", r.licenceExpiry);
      if (r.tenancyStart) {
        const tenancyId = await startTenancy(ctx, {
          propertyId, startDate: r.tenancyStart, depositReceivedDate: r.depositReceived,
          tenants: r.tenant ? r.tenant.split(/\s*(?:&|,| and )\s*/).filter(Boolean).map((name) => ({ name })) : [],
        });
        result.tenancies++;
        if (r.rtrTimeLimited) {
          // A time-limited right always gets a follow-up; without a date it shows Missing.
          await insertObligations(ctx, { clientId, propertyId, tenancyId }, [{ templateCode: "rtr_follow_up", dueDate: r.rtrFollowUp, isNotApplicable: false }]);
        }
      }
    }
    return result;
  },
});
