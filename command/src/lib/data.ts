// Server-side reads from Convex, as the signed-in user. No token, an expired one, or no active
// invite sends the browser to /signin; there is no bypass (plan §8.5).
import { fetchQuery } from "convex/nextjs";
import { ConvexError } from "convex/values";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { api } from "../../convex/_generated/api.js";
import { TOKEN_COOKIE } from "./auth.ts";
import type { CommandData } from "./model.ts";

export { api };

export async function read<Q extends FunctionReference<"query">>(q: Q, args: FunctionArgs<Q>): Promise<FunctionReturnType<Q>> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) redirect("/signin");
  try {
    return await fetchQuery(q, args, { token });
  } catch (e) {
    // Our guards throw ConvexError("Unauthenticated" | "Forbidden"); an expired or invalid token fails verification.
    if ((e instanceof ConvexError && (e.data === "Unauthenticated" || e.data === "Forbidden")) || (e instanceof Error && /InvalidAuthHeader|Could not verify|Could not parse JWT|expired|Invalid token/i.test(e.message))) redirect("/signin");
    throw e;
  }
}

/** For detail pages: a missing or malformed id renders 404, but auth failures still redirect. */
export async function readOrNull<Q extends FunctionReference<"query">>(q: Q, args: FunctionArgs<Q>): Promise<FunctionReturnType<Q> | null> {
  try {
    return await read(q, args);
  } catch (e) {
    unstable_rethrow(e);
    return null;
  }
}

export function getCommandData(today: string): Promise<CommandData> {
  return read(api.home.data, { today });
}
