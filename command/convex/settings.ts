// NOTE: unguarded until Step 1.1b (owner-only then). Local only.
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getSettings } from "./model";

export const get = query({ args: {}, handler: (ctx) => getSettings(ctx) });

export const save = mutation({
  args: { key: v.union(v.literal("cadence"), v.literal("templates"), v.literal("jobs")), value: v.any() },
  handler: async (ctx, { key, value }) => {
    if (key === "jobs" && (!/^\d{2}:\d{2}$/.test(value.scan) || !/^\d{2}:\d{2}$/.test(value.digest))) throw new Error("Times must be HH:mm");
    const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (row) await ctx.db.patch(row._id, { value, updatedAt: Date.now() });
    else await ctx.db.insert("settings", { key, value, updatedAt: Date.now() });
  },
});
