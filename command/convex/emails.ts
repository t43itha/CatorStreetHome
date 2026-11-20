import { ConvexError, v } from "convex/values";
import { userMutation } from "./lib/functions";
import { today } from "./model";

export const log = userMutation({
  args: { subject: v.string(), snippet: v.string(), status: v.union(v.literal("needs_reply"), v.literal("waiting_reply"), v.literal("reference")), clientId: v.optional(v.id("clients")) },
  handler: (ctx, a) => ctx.db.insert("emails", { ...a, occurredAt: today(), isDemo: false }),
});

export const setStatus = userMutation({
  args: { id: v.id("emails"), status: v.union(v.literal("needs_reply"), v.literal("waiting_reply"), v.literal("reference"), v.literal("resolved")) },
  handler: async (ctx, { id, status }) => { await ctx.db.patch(id, { status }); },
});

export const turnIntoAction = userMutation({
  args: { id: v.id("emails") },
  handler: async (ctx, { id }) => {
    const e = await ctx.db.get(id);
    if (!e) throw new ConvexError("Email not found");
    const actionId = await ctx.db.insert("commitments", {
      title: `Reply: ${e.subject.replace(/ — needs reply$/, "")}`, details: e.snippet, clientId: e.clientId, propertyId: e.propertyId,
      ownerType: "you", dueDate: today(), status: "open", sourceType: "email", sourceId: id, isDemo: e.isDemo,
    });
    await ctx.db.patch(id, { status: "resolved" });
    return actionId;
  },
});
