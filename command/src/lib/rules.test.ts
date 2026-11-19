import { test } from "node:test";
import assert from "node:assert/strict";
import { addMonths, excelSerialToIso, nextObligations, parseUkDate, shouldRun } from "./rules.ts";

test("parseUkDate reads day first and rejects impossible dates", () => {
  assert.equal(parseUkDate("12/01/2027"), "2027-01-12"); // the plan's Phase 1 gate case
  assert.equal(parseUkDate("1/2/2027"), "2027-02-01");
  assert.equal(parseUkDate("12 Jan 2027"), "2027-01-12");
  assert.equal(parseUkDate("3 September 2027"), "2027-09-03");
  assert.equal(parseUkDate("2027-01-12"), "2027-01-12");
  assert.equal(parseUkDate("29/02/2028"), "2028-02-29");
  assert.equal(parseUkDate("29/02/2027"), null);
  assert.equal(parseUkDate("13/13/2027"), null);
  assert.equal(parseUkDate("01/31/2027"), null); // US order is not guessed
  assert.equal(parseUkDate("12 Janz 2027"), null);
});

test("excelSerialToIso matches Excel's 1900 calendar", () => {
  assert.equal(excelSerialToIso(1), "1900-01-01");
  assert.equal(excelSerialToIso(59), "1900-02-28");
  assert.equal(excelSerialToIso(60), null); // Excel's fake 29 Feb 1900
  assert.equal(excelSerialToIso(61), "1900-03-01");
  assert.equal(excelSerialToIso(46399), "2027-01-12");
  assert.equal(excelSerialToIso(46399.75), "2027-01-12"); // time of day ignored
  assert.equal(excelSerialToIso(0), null);
});

test("addMonths clamps to the end of shorter months", () => {
  assert.equal(addMonths("2026-08-31", 6), "2027-02-28");
  assert.equal(addMonths("2027-08-31", 6), "2028-02-29");
  assert.equal(addMonths("2026-11-19", 6), "2027-05-19");
});

test("renewal evidence opens the next renewal at the new expiry", () => {
  assert.deepEqual(nextObligations({ templateCode: "gas", kind: "renewal" }, { issueDate: "2026-11-01", expiryDate: "2027-11-01" }),
    [{ templateCode: "gas", kind: "renewal", dueDate: "2027-11-01" }]);
});

test("an unsatisfactory EICR opens a remedial obligation within 28 days, or sooner if the report says", () => {
  const eicr = { templateCode: "eicr", kind: "renewal" as const };
  const [, remedial] = nextObligations(eicr, { issueDate: "2026-10-20", expiryDate: "2031-10-20", outcome: "unsatisfactory" });
  assert.deepEqual(remedial, { templateCode: "eicr_remedial", kind: "remedial", dueDate: "2026-11-17" });
  const [, sooner] = nextObligations(eicr, { issueDate: "2026-10-20", expiryDate: "2031-10-20", outcome: "unsatisfactory", reportRemedialDate: "2026-11-01" });
  assert.equal(sooner.dueDate, "2026-11-01");
  assert.equal(nextObligations(eicr, { issueDate: "2026-10-20", expiryDate: "2031-10-20", outcome: "satisfactory" }).length, 1);
});

test("a time-limited Right to Rent always opens a follow-up; without a date it has none (Missing)", () => {
  const rtr = { templateCode: "rtr", kind: "event" as const };
  assert.deepEqual(nextObligations(rtr, { rightType: "time_limited", followUpDate: "2026-11-25" }), [{ templateCode: "rtr_follow_up", kind: "follow_up", dueDate: "2026-11-25" }]);
  assert.deepEqual(nextObligations(rtr, { rightType: "time_limited" }), [{ templateCode: "rtr_follow_up", kind: "follow_up", dueDate: undefined }]);
  assert.deepEqual(nextObligations(rtr, { rightType: "unlimited" }), []);
});

test("a routine inspection schedules the next one", () => {
  assert.deepEqual(nextObligations({ templateCode: "inspection", kind: "schedule" }, { issueDate: "2026-11-25" }),
    [{ templateCode: "inspection", kind: "schedule", dueDate: "2027-05-25" }]);
});

test("shouldRun fires once a day at the London time, in winter and summer", () => {
  const settings = { scan: "07:15", digest: "07:30" };
  // Winter (GMT): 07:15 London = 07:15 UTC.
  assert.equal(shouldRun("scan", new Date("2026-12-01T07:14:00Z"), settings, []), false);
  assert.equal(shouldRun("scan", new Date("2026-12-01T07:15:00Z"), settings, []), true);
  assert.equal(shouldRun("scan", new Date("2026-12-01T09:00:00Z"), settings, [{ job: "scan", londonDate: "2026-12-01" }]), false);
  // Summer (BST): 07:15 London = 06:15 UTC, not an hour late.
  assert.equal(shouldRun("scan", new Date("2026-07-01T06:15:00Z"), settings, []), true);
  assert.equal(shouldRun("digest", new Date("2026-07-01T06:15:00Z"), settings, []), false);
  // Clock-change days.
  assert.equal(shouldRun("scan", new Date("2026-03-29T06:15:00Z"), settings, []), true);
  assert.equal(shouldRun("scan", new Date("2026-10-25T07:14:00Z"), settings, []), false);
  assert.equal(shouldRun("scan", new Date("2026-10-25T07:15:00Z"), settings, []), true);
});
