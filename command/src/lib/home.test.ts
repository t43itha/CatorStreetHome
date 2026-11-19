import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDemo } from "./demo.ts";
import { buildHome } from "./home.ts";

const today = "2026-11-19";
const view = buildHome(buildDemo(today), today);
const titles = view.urgent.map((r) => `${r.title} | ${r.sub}`);

test("urgent now: overdue, ≤7d, missing statutory on a let property, late and stalled actions, email", () => {
  assert.ok(titles.some((t) => t.startsWith("Gas Safety Certificate (CP12) | 7 Rochester")));
  assert.ok(titles.some((t) => t.startsWith("EICR |")));
  assert.ok(titles.some((t) => t.startsWith("Smoke & CO alarm check | 9 Blackheath")));
  assert.ok(titles.some((t) => t.startsWith("Send Margaret")));
  assert.ok(titles.some((t) => t.startsWith("Boiler replacement quote")));
  assert.ok(titles.some((t) => t.startsWith("Tenant reports damp")));
  assert.ok(titles.some((t) => t.startsWith("Routine inspection |")));
  assert.equal(view.urgent.length, 9);
  assert.equal(view.kpis[0].num, view.urgent.length);
});

test("missing items on vacant properties and client docs are not urgent", () => {
  assert.ok(!titles.some((t) => t.includes("Lee High Road")));
  assert.ok(!titles.some((t) => t.startsWith("AML")));
  assert.equal(view.kpis[2].num, 6);
});

test("an on-time deposit deadline is coming up, not urgent", () => {
  const compliance = view.upcoming[0].rows;
  const deposit = compliance.find((r) => r.title.startsWith("Deposit"));
  assert.ok(!compliance.some((r) => r.days < 0), "done items never appear in Coming up");
  assert.equal(deposit?.days, 9);
  assert.deepEqual(deposit?.badge, { kind: "pill", cls: "soon", label: "Due soon" });
  assert.ok(!titles.some((t) => t.startsWith("Deposit")));
});
