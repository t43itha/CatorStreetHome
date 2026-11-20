import { test } from "node:test";
import assert from "node:assert/strict";
import { clientObligations, propertyObligations, reminderStage, tenancyObligations, TEMPLATE } from "./templates.ts";

test("every obligation draft names a known template", () => {
  for (const d of [...clientObligations({ isOverseas: true }), ...propertyObligations({ hasGas: true, licenceType: "hmo" }), ...tenancyObligations({ startDate: "2025-01-09" })]) {
    assert.ok(TEMPLATE.has(d.templateCode), d.templateCode);
  }
});

test("applicability follows the facts", () => {
  assert.equal(clientObligations({ isOverseas: false }).find((d) => d.templateCode === "nrl1")?.isNotApplicable, true);
  assert.equal(clientObligations({ isOverseas: true }).find((d) => d.templateCode === "nrl1")?.isNotApplicable, false);
  assert.equal(propertyObligations({ hasGas: false, licenceType: "none" }).find((d) => d.templateCode === "gas")?.isNotApplicable, true);
  assert.equal(propertyObligations({ hasGas: true, licenceType: "none" }).find((d) => d.templateCode === "licence")?.isNotApplicable, true);
  assert.equal(propertyObligations({ hasGas: true, licenceType: "selective" }).find((d) => d.templateCode === "licence")?.isNotApplicable, false);
});

test("tenancy obligations: deposit 30 days after receipt or Missing, info sheet only before the reform", () => {
  const before = tenancyObligations({ startDate: "2025-01-09", depositReceivedDate: "2025-01-09" });
  assert.equal(before.find((d) => d.templateCode === "deposit")?.dueDate, "2025-02-08");
  assert.equal(before.find((d) => d.templateCode === "info_sheet")?.dueDate, "2026-05-31");
  const after = tenancyObligations({ startDate: "2026-06-14" });
  assert.equal(after.find((d) => d.templateCode === "deposit")?.dueDate, undefined);
  assert.equal(after.some((d) => d.templateCode === "info_sheet"), false);
});

test("reminder stages: 30d, 14d, 7d, overdue, and missing only when statutory on a let property", () => {
  const today = "2026-11-20";
  const ctx = { isStatutory: true, propertyLet: true };
  assert.equal(reminderStage({ dueDate: "2026-12-20" }, today, ctx), "30d");
  assert.equal(reminderStage({ dueDate: "2026-12-21" }, today, ctx), null);
  assert.equal(reminderStage({ dueDate: "2026-12-04" }, today, ctx), "14d");
  assert.equal(reminderStage({ dueDate: "2026-11-27" }, today, ctx), "7d");
  assert.equal(reminderStage({ dueDate: "2026-11-19" }, today, ctx), "overdue");
  assert.equal(reminderStage({}, today, ctx), "missing");
  assert.equal(reminderStage({}, today, { isStatutory: true, propertyLet: false }), null);
  assert.equal(reminderStage({ dueDate: "2026-11-19", satisfiedAt: "2026-11-01" }, today, ctx), null);
});
