import { internalMutation } from "./_generated/server";
import { seedDemo } from "./demo";

/** CLI: `npm run seed`. */
export const reset = internalMutation({ args: {}, handler: (ctx) => seedDemo(ctx) });
