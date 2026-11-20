import { v } from "convex/values";
import { userQuery } from "./lib/functions";
import { toCommandData } from "../src/lib/model.ts";

/**
 * Everything the screens read, in the CommandData shape. `today` is the London date the caller
 * renders for, so the page and the query never disagree around midnight.
 *
 */
export const data = userQuery({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const [clients, properties, tenancies, requirementTemplates, obligations, evidence, reminders, commitments, meetings, emails] =
      await Promise.all([
        ctx.db.query("clients").collect(),
        ctx.db.query("properties").collect(),
        ctx.db.query("tenancies").collect(),
        ctx.db.query("requirementTemplates").collect(),
        ctx.db.query("obligations").collect(),
        ctx.db.query("evidence").collect(),
        ctx.db.query("reminders").collect(),
        ctx.db.query("commitments").collect(),
        ctx.db.query("meetings").collect(),
        ctx.db.query("emails").collect(),
      ]);
    return toCommandData(
      { clients, properties, tenancies, requirementTemplates, obligations, evidence, reminders, commitments, meetings, emails },
      today,
    );
  },
});
