import { ConvexError, v } from "convex/values";
import { userMutation } from "./lib/functions";
import { logActivity, recordEvidence as record } from "./model";

const iso = v.optional(v.string());

export const recordEvidence = userMutation({
  args: {
    obligationId: v.id("obligations"), issueDate: iso, expiryDate: iso,
    outcome: v.optional(v.union(v.literal("satisfactory"), v.literal("unsatisfactory"))), reportRemedialDate: iso,
    rightType: v.optional(v.union(v.literal("unlimited"), v.literal("time_limited"))), followUpDate: iso,
    oneDriveFileName: v.optional(v.string()), notes: v.optional(v.string()),
  },
  handler: (ctx, { obligationId, ...input }) => record(ctx, obligationId, input),
});

/** Correct Date edits the open obligation in place: same id, so reminders already sent aren't repeated. */
export const correctDate = userMutation({
  args: { obligationId: v.id("obligations"), dueDate: v.string() },
  handler: async (ctx, { obligationId, dueDate }) => {
    const o = await ctx.db.get(obligationId);
    if (!o || o.satisfiedAt) throw new ConvexError("Only an open item's date can be corrected");
    await ctx.db.patch(obligationId, { dueDate });
    await logActivity(ctx, { entityType: "obligation", entityId: obligationId, clientId: o.clientId, propertyId: o.propertyId, action: "date_corrected", summary: `Due date corrected to ${dueDate}`, isDemo: o.isDemo });
  },
});

export const markNotApplicable = userMutation({
  args: { obligationId: v.id("obligations"), reason: v.string() },
  handler: async (ctx, { obligationId, reason }) => {
    if (!reason.trim()) throw new ConvexError("A reason is required");
    const o = await ctx.db.get(obligationId);
    if (!o) throw new ConvexError("Obligation not found");
    await ctx.db.patch(obligationId, { isNotApplicable: true, naReason: reason.trim(), disposition: undefined });
  },
});

export const setDisposition = userMutation({
  args: { obligationId: v.id("obligations"), disposition: v.union(v.literal("request_from_landlord"), v.literal("unknown")) },
  handler: async (ctx, { obligationId, disposition }) => {
    const o = await ctx.db.get(obligationId);
    if (!o) throw new ConvexError("Obligation not found");
    await ctx.db.patch(obligationId, { disposition, isNotApplicable: false, naReason: undefined });
  },
});
