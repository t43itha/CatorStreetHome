import { ConvexError, v } from "convex/values";
import { userMutation } from "./lib/functions";
import { logActivity, reserveDue, today } from "./model";

/** Run the compliance scan now (Settings, and the scheduler tick in Phase 2). */
export const runScan = userMutation({ args: {}, handler: (ctx) => reserveDue(ctx, today()) });

export const update = userMutation({
  args: { id: v.id("reminders"), subject: v.string(), body: v.string() },
  handler: async (ctx, { id, subject, body }) => { await ctx.db.patch(id, { subject, body }); },
});

export const markSent = userMutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    const r = await ctx.db.get(id);
    if (!r) throw new ConvexError("Draft not found");
    await ctx.db.patch(id, { status: "sent", sentAt: Date.now() });
    await logActivity(ctx, { entityType: "reminder", entityId: id, clientId: r.clientId, action: "sent", summary: `Sent: ${r.subject}`, isDemo: r.isDemo });
  },
});

export const dismiss = userMutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => { await ctx.db.patch(id, { status: "dismissed" }); },
});
