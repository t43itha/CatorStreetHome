// NOTE: unguarded until Step 1.1b. Local only.
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ownerType } from "./schema";
import { logActivity } from "./model";

export const create = mutation({
  args: { title: v.string(), scheduledAt: v.string(), clientId: v.optional(v.id("clients")), context: v.optional(v.string()), teamsJoinUrl: v.optional(v.string()) },
  handler: async (ctx, a) => {
    if (!a.title.trim()) throw new Error("Give the meeting a title");
    return ctx.db.insert("meetings", { title: a.title.trim(), scheduledAt: a.scheduledAt, clientId: a.clientId, context: a.context ?? "", teamsLabel: a.teamsJoinUrl ? "Join Teams" : undefined, decisions: [], isDemo: false });
  },
});

export const saveNotes = mutation({
  args: { id: v.id("meetings"), notes: v.string() },
  handler: async (ctx, { id, notes }) => { await ctx.db.patch(id, { notes }); },
});

export const addDecision = mutation({
  args: { id: v.id("meetings"), decision: v.string() },
  handler: async (ctx, { id, decision }) => {
    const m = await ctx.db.get(id);
    if (!m || !decision.trim()) throw new Error("Enter the decision");
    await ctx.db.patch(id, { decisions: [...(m.decisions ?? []), decision.trim()] });
    await logActivity(ctx, { entityType: "meeting", entityId: id, clientId: m.clientId, action: "decision", summary: `Decision: ${decision.trim()}`, isDemo: m.isDemo });
  },
});

/** Each action item becomes a commitment that links back to the meeting. */
export const addAction = mutation({
  args: { id: v.id("meetings"), title: v.string(), ownerType, waitingOn: v.optional(v.string()), dueDate: v.optional(v.string()) },
  handler: async (ctx, { id, ...a }) => {
    const m = await ctx.db.get(id);
    if (!m || !a.title.trim()) throw new Error("Enter the action");
    return ctx.db.insert("commitments", {
      ...a, title: a.title.trim(), clientId: m.clientId, propertyId: m.propertyId, status: a.ownerType === "you" ? "open" : "waiting",
      lastChasedAt: a.ownerType === "you" ? undefined : m.scheduledAt.slice(0, 10), sourceType: "meeting", sourceId: id, details: `From meeting · ${m.title}`, isDemo: m.isDemo,
    });
  },
});
