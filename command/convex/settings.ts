import { ConvexError, v } from "convex/values";
import { ownerMutation, userQuery } from "./lib/functions";
import { getSettings } from "./model";

export const get = userQuery({ args: {}, handler: (ctx) => getSettings(ctx) });

export const save = ownerMutation({
  args: { key: v.union(v.literal("cadence"), v.literal("templates"), v.literal("jobs")), value: v.any() },
  handler: async (ctx, { key, value }) => {
    if (key === "jobs" && (!/^\d{2}:\d{2}$/.test(value.scan) || !/^\d{2}:\d{2}$/.test(value.digest))) throw new ConvexError("Times must be HH:mm");
    const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (row) await ctx.db.patch(row._id, { value, updatedAt: Date.now() });
    else await ctx.db.insert("settings", { key, value, updatedAt: Date.now() });
  },
});
