// Who may use the app and with what role (plan §8.3). Identity is Microsoft's; authorisation is this table.
import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { identityMutation, identityQuery, ownerMutation, userQuery } from "./lib/functions";

const role = v.union(v.literal("owner"), v.literal("staff"));
const norm = (e: string) => e.trim().toLowerCase();

async function audit(ctx: MutationCtx, action: string, summary: string, actor?: { _id: string; name?: string; email: string }) {
  await ctx.db.insert("activityLogs", { entityType: "user", entityId: actor?._id ?? "cli", action, summary, actorUserId: actor?._id, actorName: actor?.name ?? actor?.email ?? "CLI", createdAt: Date.now(), isDemo: false });
}

/** The signed-in person's row, or null when they have no active access (the app then shows sign-in or "not invited"). */
export const me = identityQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", ctx.identity.tokenIdentifier)).unique();
    return user && user.status === "active" ? { _id: user._id, name: user.name, email: user.email, role: user.role } : null;
  },
});

/**
 * First sign-in: claim the invited row whose email matches the verified token. Email is used only here,
 * only from the token, never from arguments; afterwards users are matched by tokenIdentifier.
 */
export const claim = identityMutation({
  args: {},
  handler: async (ctx) => {
    const { identity } = ctx;
    const existing = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (existing) {
      if (existing.status !== "active") throw new ConvexError("Forbidden");
      await ctx.db.patch(existing._id, { lastSeenAt: Date.now() });
      return existing._id;
    }
    const email = identity.email ?? (identity as { preferredUsername?: string }).preferredUsername;
    if (!email) throw new ConvexError("Forbidden");
    const invited = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", norm(email))).unique();
    if (!invited || invited.status !== "invited") throw new ConvexError("Forbidden");
    await ctx.db.patch(invited._id, { tokenIdentifier: identity.tokenIdentifier, entraObjectId: identity.subject, name: identity.name, status: "active", lastSeenAt: Date.now() });
    await audit(ctx, "signed_in_first_time", `${identity.name ?? email} signed in for the first time`, { ...invited, name: identity.name });
    return invited._id;
  },
});

export const list = userQuery({
  args: {},
  handler: async (ctx) => (ctx.user.role === "owner" ? await ctx.db.query("users").collect() : []).map((u) => ({ _id: u._id, email: u.email, name: u.name, role: u.role, status: u.status, lastSeenAt: u.lastSeenAt })),
});

export const invite = ownerMutation({
  args: { email: v.string(), role },
  handler: async (ctx, { email, role }) => {
    if (!/^[^@\s]+@[^@\s]+$/.test(email)) throw new ConvexError("Enter a valid email");
    if (await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", norm(email))).unique()) throw new ConvexError("That person already has an invite");
    const id = await ctx.db.insert("users", { email: norm(email), role, status: "invited", invitedAt: Date.now() });
    await audit(ctx, "invited", `Invited ${norm(email)} as ${role}`, ctx.user);
    return id;
  },
});

async function activeOwners(ctx: MutationCtx) {
  return (await ctx.db.query("users").withIndex("by_status", (q) => q.eq("status", "active")).collect()).filter((u) => u.role === "owner");
}

export const setRole = ownerMutation({
  args: { id: v.id("users"), role },
  handler: async (ctx, { id, role }) => {
    const u = await ctx.db.get(id);
    if (!u) throw new ConvexError("User not found");
    if (u.role === "owner" && role !== "owner" && u.status === "active" && (await activeOwners(ctx)).length <= 1) throw new ConvexError("You can't demote the last active owner");
    await ctx.db.patch(id, { role });
    await audit(ctx, "role_changed", `${u.email} is now ${role}`, ctx.user);
  },
});

export const setStatus = ownerMutation({
  args: { id: v.id("users"), status: v.union(v.literal("active"), v.literal("disabled")) },
  handler: async (ctx, { id, status }) => {
    const u = await ctx.db.get(id);
    if (!u) throw new ConvexError("User not found");
    if (status === "active" && !u.tokenIdentifier) throw new ConvexError("They need to sign in to accept the invite first");
    if (status === "disabled" && u.role === "owner" && (await activeOwners(ctx)).length <= 1) throw new ConvexError("You can't disable the last active owner");
    await ctx.db.patch(id, { status });
    await audit(ctx, status === "disabled" ? "disabled" : "enabled", `${u.email} ${status === "disabled" ? "disabled" : "re-enabled"}`, ctx.user);
  },
});

/** CLI only, for the first owner: `npx convex run users:inviteInternal '{"email":"…","role":"owner"}'`. */
export const inviteInternal = internalMutation({
  args: { email: v.string(), role },
  handler: async (ctx, { email, role }) => {
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", norm(email))).unique();
    if (existing) return existing._id;
    const id = await ctx.db.insert("users", { email: norm(email), role, status: "invited", invitedAt: Date.now() });
    await audit(ctx, "invited", `Invited ${norm(email)} as ${role} from the CLI`);
    return id;
  },
});
