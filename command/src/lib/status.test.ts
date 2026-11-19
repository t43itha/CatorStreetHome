import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, diffCalendarDays, formatDue, isUrgent, status, todayLondon } from "./status.ts";

const today = "2026-11-19";
const due = (days: number) => ({ dueDate: addDays(today, days) });

test("status bands follow the plan's thresholds", () => {
  assert.equal(status(due(-1), today), "overdue");
  assert.equal(status(due(0), today), "urgent");
  assert.equal(status(due(7), today), "urgent");
  assert.equal(status(due(8), today), "soon");
  assert.equal(status(due(30), today), "soon");
  assert.equal(status(due(31), today), "early");
  assert.equal(status(due(60), today), "early");
  assert.equal(status(due(61), today), "current");
});

test("N/A beats done, done beats dates, no date is missing", () => {
  assert.equal(status({ ...due(-10), isNotApplicable: true, satisfiedAt: today }, today), "na");
  assert.equal(status({ ...due(-10), satisfiedAt: today }, today), "done");
  assert.equal(status({}, today), "missing");
});

test("missing is urgent only when statutory on a let property", () => {
  assert.equal(isUrgent({}, today, { isStatutory: true, propertyLet: true }), true);
  assert.equal(isUrgent({}, today, { isStatutory: true, propertyLet: false }), false);
  assert.equal(isUrgent({}, today, { isStatutory: false, propertyLet: true }), false);
  assert.equal(isUrgent(due(9), today, { isStatutory: true, propertyLet: true }), false);
  assert.equal(isUrgent(due(-1), today, { isStatutory: false, propertyLet: false }), true);
});

test("todayLondon uses the London calendar in summer and winter", () => {
  assert.equal(todayLondon(new Date("2026-06-30T23:30:00Z")), "2026-07-01");
  assert.equal(todayLondon(new Date("2026-12-31T23:30:00Z")), "2026-12-31");
});

test("calendar day differences ignore clock changes", () => {
  assert.equal(diffCalendarDays("2026-03-30", "2026-03-28"), 2);
  assert.equal(diffCalendarDays("2026-10-26", "2026-10-24"), 2);
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
});

test("formatDue reads naturally", () => {
  assert.equal(formatDue(-3), "3 days overdue");
  assert.equal(formatDue(-1), "1 day overdue");
  assert.equal(formatDue(0), "today");
  assert.equal(formatDue(5), "in 5 days");
});
