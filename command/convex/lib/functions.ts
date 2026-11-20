// The only place public Convex functions are created (plan §8.3). Every call checks identity and role
// on the server, so disabling a user locks them out on their next request. A test enforces that no
// other module imports `query`, `mutation` or `action` from _generated/server.
import { ConvexError } from "convex/values";
import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { mutation, query } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export type Role = "owner" | "staff";

export async function requireUser(ctx: QueryCtx, min: Role): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthenticated");
  const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
  if (!user || user.status !== "active") throw new ConvexError("Forbidden");
  if (min === "owner" && user.role !== "owner") throw new ConvexError("Forbidden");
  return user;
}

export const userQuery = customQuery(query, customCtx(async (ctx) => ({ user: await requireUser(ctx, "staff") })));
export const userMutation = customMutation(mutation, customCtx(async (ctx) => ({ user: await requireUser(ctx, "staff") })));
export const ownerMutation = customMutation(mutation, customCtx(async (ctx) => ({ user: await requireUser(ctx, "owner") })));

/** Signed in with a valid Microsoft token, but not necessarily invited yet: only users.me and users.claim. */
export const identityQuery = customQuery(query, customCtx(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthenticated");
  return { identity };
}));
export const identityMutation = customMutation(mutation, customCtx(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthenticated");
  return { identity };
}));
