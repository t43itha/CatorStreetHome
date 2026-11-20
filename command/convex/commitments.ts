import { ConvexError, v } from "convex/values";
import { userMutation } from "./lib/functions";
import { ownerType } from "./schema";
import { logActivity, today } from "./model";

export const create = userMutation({
  args: {
    title: v.string(), details: v.optional(v.string()), ownerType, waitingOn: v.optional(v.string()), dueDate: v.optional(v.string()),
    clientId: v.optional(v.id("clients")), propertyId: v.optional(v.id("properties")), obligationId: v.optional(v.id("obligations")),
    sourceType: v.optional(v.union(v.literal("meeting"), v.literal("email"), v.literal("compliance"), v.literal("manual"))), sourceId: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    if (!a.title.trim()) throw new ConvexError("Give the action a title");
    const id = await ctx.db.insert("commitments", {
      ...a, title: a.title.trim(), status: a.ownerType === "you" ? "open" : "waiting",
      lastChasedAt: a.ownerType === "you" ? undefined : today(), sourceType: a.sourceType ?? "manual", isDemo: false,
    });
    await logActivity(ctx, { entityType: "commitment", entityId: id, clientId: a.clientId, propertyId: a.propertyId, action: "created", summary: `Action: ${a.title.trim()}` });
    return id;
  },
});

export const logChase = userMutation({
  args: { id: v.id("commitments") },
  handler: async (ctx, { id }) => {
    const c = await ctx.db.get(id);
    if (!c) throw new ConvexError("Action not found");
    await ctx.db.patch(id, { lastChasedAt: today() });
    await logActivity(ctx, { entityType: "commitment", entityId: id, clientId: c.clientId, propertyId: c.propertyId, action: "chased", summary: `Chased: ${c.title}`, isDemo: c.isDemo });
  },
});

export const complete = userMutation({
  args: { id: v.id("commitments") },
  handler: async (ctx, { id }) => {
    const c = await ctx.db.get(id);
    if (!c) throw new ConvexError("Action not found");
    await ctx.db.patch(id, { status: "done", completedAt: today() });
    await logActivity(ctx, { entityType: "commitment", entityId: id, clientId: c.clientId, propertyId: c.propertyId, action: "done", summary: `Done: ${c.title}`, isDemo: c.isDemo });
  },
});

export const reschedule = userMutation({
  args: { id: v.id("commitments"), dueDate: v.string() },
  handler: async (ctx, { id, dueDate }) => { await ctx.db.patch(id, { dueDate }); },
});
