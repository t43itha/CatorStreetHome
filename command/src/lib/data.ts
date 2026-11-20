// Server-side reads from Convex for the server-rendered pages.
import { fetchQuery } from "convex/nextjs";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api.js";
import type { CommandData } from "./model.ts";

export { api };

export function getCommandData(today: string): Promise<CommandData> {
  return fetchQuery(api.home.data, { today });
}

export function read<Q extends FunctionReference<"query">>(q: Q, args: FunctionArgs<Q>): Promise<FunctionReturnType<Q>> {
  return fetchQuery(q, args);
}
