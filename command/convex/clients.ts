import { ConvexError, v } from "convex/values";
import { userMutation, userQuery } from "./lib/functions";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { insertObligations, logActivity, today } from "./model";
import { clientObligations } from "../src/lib/templates.ts";

const norm = (s?: string) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const digits = (s?: string) => (s ?? "").replace(/\D/g, "");

export async function possibleDuplicates(ctx: QueryCtx, q: { email?: string; phone?: string; name: string }) {
  const all = await ctx.db.query("clients").collect();
  return all.flatMap((c) => {
    const matchedOn = q.email && norm(c.email) === norm(q.email) ? "email" : q.phone && digits(c.phone).length > 5 && digits(c.phone) === digits(q.phone) ? "phone" : norm(c.name) === norm(q.name) ? "name" : null;
    return matchedOn ? [{ clientId: c._id, name: c.name, matchedOn }] : [];
  });
}

export const findPossibleDuplicates = userQuery({
  args: { email: v.optional(v.string()), phone: v.optional(v.string()), name: v.string() },
  handler: (ctx, q) => possibleDuplicates(ctx, q),
});

export const clientInput = {
  name: v.string(), clientType: v.optional(v.union(v.literal("individual"), v.literal("company"))), email: v.optional(v.string()), phone: v.optional(v.string()),
  preferredChannel: v.optional(v.string()), serviceTier: v.string(), isOverseas: v.boolean(), repairLimitGbp: v.optional(v.number()), oneDriveFolderUrl: v.optional(v.string()),
};

export async function createClient(ctx: MutationCtx, a: { name: string; serviceTier: string; isOverseas: boolean; email?: string; phone?: string; clientType?: "individual" | "company"; preferredChannel?: string; repairLimitGbp?: number; oneDriveFolderUrl?: string }) {
  if (!a.name.trim()) throw new ConvexError("Enter the landlord's name");
  const clientId = await ctx.db.insert("clients", { ...a, name: a.name.trim(), status: "onboarding", onboardingStartedAt: today(), isDemo: false });
  await insertObligations(ctx, { clientId }, clientObligations({ isOverseas: a.isOverseas }));
  await logActivity(ctx, { entityType: "client", entityId: clientId, clientId, action: "created", summary: `Onboarding started for ${a.name.trim()}` });
  return clientId;
}

/** Creates the client in `onboarding` and its client obligations. */
export const create = userMutation({ args: clientInput, handler: (ctx, a) => createClient(ctx, a) });
