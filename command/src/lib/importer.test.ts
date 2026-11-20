import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPreview, detectMapping, inWords, parseDateCell, TEMPLATE_HEADERS } from "./importer.ts";

test("the CSPS template's own headers map to every field", () => {
  const m = detectMapping(TEMPLATE_HEADERS);
  assert.equal(Object.keys(m).length, TEMPLATE_HEADERS.length);
});

test("common spreadsheet headers are recognised", () => {
  const m = detectMapping(["Client", "E-mail", "Property Address", "Post Code", "CP12 Expiry", "EICR", "Move-in"]);
  assert.equal(m.landlord, "Client");
  assert.equal(m.email, "E-mail");
  assert.equal(m.address, "Property Address");
  assert.equal(m.postcode, "Post Code");
  assert.equal(m.gasExpiry, "CP12 Expiry");
  assert.equal(m.eicrExpiry, "EICR");
  assert.equal(m.tenancyStart, "Move-in");
});

test("the Phase 1 gate: 12/01/2027 previews as 12 Jan 2027", () => {
  assert.equal(inWords(parseDateCell("12/01/2027")!), "12 Jan 2027");
  assert.equal(inWords(parseDateCell(46399)!), "12 Jan 2027");
});

test("the swap switch flips day and month", () => {
  assert.equal(parseDateCell("01/12/2027", true), "2027-01-12");
  assert.equal(parseDateCell(46399, true), "2027-12-01");
  assert.equal(parseDateCell("31/01/2027", true), null);
});

test("preview flags missing emails, unreadable dates, duplicates and time-limited Right to Rent with no date", () => {
  const mapping = detectMapping(TEMPLATE_HEADERS);
  const base = { Landlord: "A Landlord", "Property address": "1 High St", Postcode: "se1 1aa", "Gas certificate expiry": "12/01/2027" };
  const rows = buildPreview([
    { ...base, Email: "a@example.com" },
    { ...base, "Gas certificate expiry": "13/13/2027", "Right to Rent time-limited": "yes" },
    { Landlord: "", "Property address": "", Postcode: "" },
  ], mapping);
  assert.deepEqual(rows[0].flags, []);
  assert.equal(rows[0].row.gasExpiry, "2027-01-12");
  assert.equal(rows[0].row.postcode, "SE1 1AA");
  assert.ok(rows[1].flags.some((f) => f.startsWith("Can't read gas certificate expiry")));
  assert.ok(rows[1].flags.includes("No landlord email"));
  assert.ok(rows[1].flags.includes("Time-limited Right to Rent with no follow-up date"));
  assert.ok(rows[1].flags.includes("Duplicate of row 1"));
  assert.equal(rows[2].blocking, true);
});
