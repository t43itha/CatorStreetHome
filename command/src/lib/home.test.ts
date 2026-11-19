import { test } from "node:test";
import assert from "node:assert/strict";
import { toCommandData } from "./model.ts";
import { demoRows } from "./seedData.ts";
import { buildHome } from "./home.ts";

const today = "2026-11-19";
const view = buildHome(toCommandData(demoRows(today), today), today);
const titles = view.urgent.map((r) => `${r.title} | ${r.sub}`);

test("urgent now: overdue, ≤7d, missing statutory on a let property, late and stalled actions, email", () => {
  assert.ok(titles.some((t) => t.startsWith("Gas Safety Certificate (CP12) | 7 Rochester")));
  assert.ok(titles.some((t) => t.startsWith("EICR |")));
  assert.ok(titles.some((t) => t.startsWith("Smoke & CO alarm check | 9 Blackheath")));
  assert.ok(titles.some((t) => t.startsWith("Send Margaret")));
  assert.ok(titles.some((t) => t.startsWith("Boiler replacement quote")));
  assert.ok(titles.some((t) => t.startsWith("Tenant reports damp")));
  assert.ok(titles.some((t) => t.startsWith("Routine inspection |")));
  assert.equal(view.urgent.length, 13);
  assert.equal(view.kpis[0].num, view.urgent.length);
});

test("missing items on vacant properties and client docs are not urgent", () => {
  assert.ok(!titles.some((t) => t.includes("Lee High Road")));
  assert.ok(!titles.some((t) => t.startsWith("AML")));
  assert.equal(view.kpis[2].num, 8);
});

test("an on-time deposit deadline is coming up, not urgent", () => {
  const compliance = view.upcoming[0].rows;
  const deposit = compliance.find((r) => r.title.startsWith("Deposit"));
  assert.ok(!compliance.some((r) => r.days < 0), "done items never appear in Coming up");
  assert.equal(deposit?.days, 9);
  assert.deepEqual(deposit?.badge, { kind: "pill", cls: "soon", label: "Due soon" });
  assert.ok(!titles.some((t) => t.startsWith("Deposit")));
});

test("review failure cases surface correctly", () => {
  const row = (start: string) => view.urgent.find((r) => `${r.title} | ${r.sub}`.startsWith(start));
  assert.equal(row("Gas Safety Certificate (CP12) | 41 Maidstone")?.when, "no date recorded");
  assert.equal(row("EICR remedial work | 41 Maidstone")?.when, "2 days overdue");
  assert.match(row("Information sheet")!.when, /days overdue$/);
  assert.equal(row("Right to Rent follow-up | 9 Blackheath")?.when, "no date recorded");
  // The old tenancy's completed deposit is history; only the new tenancy's deposit (due in 9 days) is open.
  const deposits = view.upcoming[0].rows.filter((r) => r.title.startsWith("Deposit"));
  assert.deepEqual(deposits.map((r) => r.days), [9]);
});

test("urgent compliance is ordered most overdue first, undated last", () => {
  const whens = view.urgent.slice(0, 9).map((r) => r.when);
  assert.match(whens[0], /days overdue$/);
  assert.deepEqual(whens.slice(-3), ["no date recorded", "no date recorded", "no date recorded"]);
});
