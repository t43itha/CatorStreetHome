/// <reference types="vite/client" />
// Step 1.1b gate (plan §9): every public function refuses callers without an active invite.
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { seedDemo } from "./demo";

const modules = import.meta.glob("./**/*.*s");
const ISSUER = "https://login.microsoftonline.com/test-tenant/v2.0";
const who = (sub: string, email: string) => ({ issuer: ISSUER, subject: sub, tokenIdentifier: `${ISSUER}|${sub}`, email, name: email.split("@")[0] });

type Fn = { name: string; kind: "query" | "mutation"; args: unknown; owner: boolean; identityOnly: boolean };

// Public functions, discovered from the modules themselves so a new one can't slip past.
async function publicFunctions(): Promise<Fn[]> {
  const out: Fn[] = [];
  for (const [path, load] of Object.entries(modules)) {
    if (path.includes("_generated") || path.endsWith(".test.ts") || path.includes("/lib/") || path.endsWith("auth.config.ts") || path.endsWith("schema.ts")) continue;
    const mod = (await load()) as Record<string, { isPublic?: boolean; isQuery?: boolean; isMutation?: boolean; exportArgs?: () => string }>;
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    for (const [name, fn] of Object.entries(mod)) {
      if (!fn?.isPublic || !(fn.isQuery || fn.isMutation)) continue;
      const decl = new RegExp(`export const ${name} = (\\w+)\\(`).exec(source)?.[1] ?? "";
      out.push({ name: `${path.replace("./", "").replace(/\.ts$/, "")}:${name}`, kind: fn.isQuery ? "query" : "mutation", args: JSON.parse(fn.exportArgs!()), owner: decl === "ownerMutation", identityOnly: decl.startsWith("identity") });
    }
  }
  return out;
}

// Valid arguments generated from each function's validators, so the call reaches the auth check.
function sample(v: any, ids: Record<string, string>): unknown {
  switch (v.type) {
    case "object": return Object.fromEntries(Object.entries(v.value).filter(([, f]: any) => !f.optional).map(([k, f]: any) => [k, sample(f.fieldType, ids)]));
    case "string": return "2026-11-20";
    case "number": case "float64": return 1;
    case "boolean": return false;
    case "literal": return v.value;
    case "union": return sample(v.value[0], ids);
    case "array": return [];
    case "id": return ids[v.tableName];
    case "any": return {};
    default: return null;
  }
}

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    await seedDemo(ctx);
    const first = async (table: any) => (await ctx.db.query(table).first())?._id as string;
    const out: Record<string, string> = {};
    for (const table of ["clients", "properties", "tenancies", "obligations", "commitments", "meetings", "reminders", "emails"]) out[table] = await first(table);
    out.users = await ctx.db.insert("users", { email: "staff@csps.test", role: "staff", status: "active", tokenIdentifier: `${ISSUER}|staff`, invitedAt: 0 });
    await ctx.db.insert("users", { email: "owner@csps.test", role: "owner", status: "active", tokenIdentifier: `${ISSUER}|owner`, invitedAt: 0 });
    await ctx.db.insert("users", { email: "gone@csps.test", role: "owner", status: "disabled", tokenIdentifier: `${ISSUER}|gone`, invitedAt: 0 });
    return out;
  });
  return { t, ids };
}

const call = (t: any, f: Fn, ids: Record<string, string>) => {
  const ref = makeFunctionReference<any>(f.name);
  const args = sample(f.args, ids);
  return f.kind === "query" ? t.query(ref, args) : t.mutation(ref, args);
};

describe("every public function is guarded", async () => {
  const fns = await publicFunctions();

  test("discovers the app's functions", () => {
    expect(fns.length).toBeGreaterThan(30);
    expect(fns.filter((f) => f.owner).map((f) => f.name).sort()).toEqual(
      ["demo:clear", "demo:reset", "imports:commit", "onboarding:discard", "settings:save", "users:invite", "users:setRole", "users:setStatus"],
    );
  });

  for (const f of fns) {
    test(`${f.name}: no identity → Unauthenticated`, async () => {
      const { t, ids } = await setup();
      await expect(call(t, f, ids)).rejects.toThrow(/Unauthenticated/);
    });
    if (f.name === "users:me") continue; // answers null rather than throwing, so the UI can show "not invited"
    if (f.identityOnly) continue; // users:claim is covered by the invite tests below
    test(`${f.name}: valid token but not invited → Forbidden`, async () => {
      const { t, ids } = await setup();
      await expect(call(t.withIdentity(who("stranger", "stranger@csps.test")), f, ids)).rejects.toThrow(/Forbidden/);
    });
    test(`${f.name}: disabled user → Forbidden`, async () => {
      const { t, ids } = await setup();
      await expect(call(t.withIdentity(who("gone", "gone@csps.test")), f, ids)).rejects.toThrow(/Forbidden/);
    });
    if (f.owner) {
      test(`${f.name}: staff calling an owner function → Forbidden`, async () => {
        const { t, ids } = await setup();
        await expect(call(t.withIdentity(who("staff", "staff@csps.test")), f, ids)).rejects.toThrow(/Forbidden/);
      });
    }
  }
});

describe("invites and access", () => {
  test("an invited person claims access at first sign-in, by the token's email only", async () => {
    const { t } = await setup();
    await t.run((ctx) => ctx.db.insert("users", { email: "new@csps.test", role: "staff", status: "invited", invitedAt: 0 }));
    const newbie = t.withIdentity(who("newbie", "New@CSPS.test"));
    expect(await newbie.query(makeFunctionReference<"query">("users:me"), {})).toBeNull();
    await newbie.mutation(makeFunctionReference<"mutation">("users:claim"), {});
    expect(await newbie.query(makeFunctionReference<"query">("users:me"), {})).toMatchObject({ email: "new@csps.test", role: "staff" });
    await expect(t.withIdentity(who("other", "other@csps.test")).mutation(makeFunctionReference<"mutation">("users:claim"), {})).rejects.toThrow(/Forbidden/);
  });

  test("an active staff member can read and act; disabling them locks the next call", async () => {
    const { t, ids } = await setup();
    const staff = t.withIdentity(who("staff", "staff@csps.test"));
    const data = await staff.query(makeFunctionReference<"query">("home:data"), { today: "2026-11-20" });
    expect(data.compliance.length).toBeGreaterThan(20);
    await staff.mutation(makeFunctionReference<"mutation">("commitments:logChase"), { id: ids.commitments });
    const owner = t.withIdentity(who("owner", "owner@csps.test"));
    await owner.mutation(makeFunctionReference<"mutation">("users:setStatus"), { id: ids.users, status: "disabled" });
    await expect(staff.query(makeFunctionReference<"query">("home:data"), { today: "2026-11-20" })).rejects.toThrow(/Forbidden/);
  });

  test("the last active owner can't be disabled or demoted", async () => {
    const { t } = await setup();
    const owner = t.withIdentity(who("owner", "owner@csps.test"));
    const ownerId = await t.run(async (ctx) => (await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", "owner@csps.test")).unique())!._id);
    await expect(owner.mutation(makeFunctionReference<"mutation">("users:setStatus"), { id: ownerId, status: "disabled" })).rejects.toThrow(/last active owner/);
    await expect(owner.mutation(makeFunctionReference<"mutation">("users:setRole"), { id: ownerId, role: "staff" })).rejects.toThrow(/last active owner/);
  });

  test("activity is attributed to the signed-in user, not to arguments", async () => {
    const { t, ids } = await setup();
    await t.withIdentity(who("staff", "staff@csps.test")).mutation(makeFunctionReference<"mutation">("commitments:logChase"), { id: ids.commitments });
    const log = await t.run(async (ctx) => (await ctx.db.query("activityLogs").collect()).find((a) => a.action === "chased"));
    expect(log?.actorUserId).toBe(ids.users);
  });
});

test("only convex/lib/functions.ts creates public functions", () => {
  const offenders = readdirSync(new URL(".", import.meta.url)).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .filter((f) => /import\s*\{[^}]*\b(query|mutation|action)\b[^}]*\}\s*from\s*"\.\/_generated\/server"/.test(readFileSync(new URL(f, import.meta.url), "utf8")));
  expect(offenders).toEqual([]);
});
