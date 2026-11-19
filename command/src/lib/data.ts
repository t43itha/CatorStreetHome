// Server-side read of everything the screens show, from Convex.
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api.js";
import type { CommandData } from "./model.ts";

export function getCommandData(today: string): Promise<CommandData> {
  return fetchQuery(api.home.data, { today });
}
