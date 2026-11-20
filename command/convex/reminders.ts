// NOTE: unguarded until Step 1.1b. Local only. Phase 1 mode: "push" is the human copying or using mailto, then Mark sent.
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { logActivity, reserveDue, today } from "./model";

/** Run the compliance scan now (Settings, and the scheduler tick in Phase 2). */
export const runScan = mutation({ args: {}, handler: (ctx) => reserveDue(ctx, today()) });

export const update = mutation({
  args: { id: v.id("reminders"), subject: v.string(), body: v.string() },
  handler: async (ctx, { id, subject, body }) => { await ctx.db.patch(id, { subject, body }); },
});

export const markSent = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    const r = await ctx.db.get(id);
    if (!r) throw new Error("Draft not found");
    await ctx.db.patch(id, { status: "sent", sentAt: Date.now() });
    await logActivity(ctx, { entityType: "reminder", entityId: id, clientId: r.clientId, action: "sent", summary: `Sent: ${r.subject}`, isDemo: r.isDemo });
  },
});

export const dismiss = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => { await ctx.db.patch(id, { status: "dismissed" }); },
});
