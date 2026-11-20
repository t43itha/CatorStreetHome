// Excel/CSV import (plan Screen 7). Pure: header mapping, UK-safe date cells, preview flags.
// One row per property; landlord columns repeat for landlords with several properties.
import { excelSerialToIso, parseUkDate } from "./rules.ts";

export type FieldType = "text" | "date" | "bool";
export interface Field { key: ImportKey; label: string; type: FieldType; required?: boolean; aliases: string[] }

export type ImportKey =
  | "landlord" | "email" | "phone" | "tier" | "overseas" | "address" | "postcode" | "hasGas" | "licence"
  | "tenant" | "tenancyStart" | "depositReceived" | "gasExpiry" | "eicrExpiry" | "epcExpiry" | "insuranceRenewal" | "licenceExpiry" | "rtrFollowUp" | "rtrTimeLimited";

export const FIELDS: Field[] = [
  { key: "landlord", label: "Landlord", type: "text", required: true, aliases: ["landlord", "client", "owner", "landlord name"] },
  { key: "email", label: "Email", type: "text", aliases: ["email", "e-mail", "landlord email"] },
  { key: "phone", label: "Phone", type: "text", aliases: ["phone", "mobile", "telephone", "tel"] },
  { key: "tier", label: "Service tier", type: "text", aliases: ["tier", "service", "service tier", "package"] },
  { key: "overseas", label: "Overseas landlord", type: "bool", aliases: ["overseas", "non-resident", "nrl"] },
  { key: "address", label: "Property address", type: "text", required: true, aliases: ["address", "property", "property address", "address line 1"] },
  { key: "postcode", label: "Postcode", type: "text", required: true, aliases: ["postcode", "post code", "zip"] },
  { key: "hasGas", label: "Gas supply", type: "bool", aliases: ["gas", "has gas", "gas supply"] },
  { key: "licence", label: "Council licence", type: "text", aliases: ["licence", "license", "council licence", "licensing"] },
  { key: "tenant", label: "Tenant name(s)", type: "text", aliases: ["tenant", "tenants", "tenant name"] },
  { key: "tenancyStart", label: "Tenancy start", type: "date", aliases: ["tenancy start", "start date", "move in", "move-in"] },
  { key: "depositReceived", label: "Deposit received", type: "date", aliases: ["deposit received", "deposit date"] },
  { key: "gasExpiry", label: "Gas certificate expiry", type: "date", aliases: ["gas expiry", "cp12 expiry", "gas safety expiry", "gas cert expiry"] },
  { key: "eicrExpiry", label: "EICR expiry", type: "date", aliases: ["eicr expiry", "eicr", "electrical expiry"] },
  { key: "epcExpiry", label: "EPC expiry", type: "date", aliases: ["epc expiry", "epc"] },
  { key: "insuranceRenewal", label: "Insurance renewal", type: "date", aliases: ["insurance renewal", "insurance expiry", "insurance"] },
  { key: "licenceExpiry", label: "Licence expiry", type: "date", aliases: ["licence expiry", "license expiry"] },
  { key: "rtrTimeLimited", label: "Right to Rent time-limited", type: "bool", aliases: ["rtr time limited", "time limited", "right to rent time-limited"] },
  { key: "rtrFollowUp", label: "Right to Rent follow-up", type: "date", aliases: ["rtr follow up", "right to rent follow-up", "rtr follow-up", "visa expiry"] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** field key → header, by exact alias first, then by containment. */
export function detectMapping(headers: string[]): Partial<Record<ImportKey, string>> {
  const mapping: Partial<Record<ImportKey, string>> = {};
  const used = new Set<string>();
  for (const pass of ["exact", "contains"] as const) {
    for (const f of FIELDS) {
      if (mapping[f.key]) continue;
      const h = headers.find((h) => !used.has(h) && [f.label, ...f.aliases].some((a) => (pass === "exact" ? norm(h) === norm(a) : norm(h).includes(norm(a)))));
      if (h) { mapping[f.key] = h; used.add(h); }
    }
  }
  return mapping;
}

/** A date cell: an Excel serial number, or text in a UK format. `swap` flips day and month. */
export function parseDateCell(value: unknown, swap = false): string | null {
  if (value === undefined || value === null || value === "") return null;
  let iso: string | null;
  if (typeof value === "number") iso = excelSerialToIso(value);
  else {
    const text = String(value).trim();
    if (/^\d+(\.\d+)?$/.test(text)) iso = excelSerialToIso(Number(text));
    else if (swap) {
      const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
      return m ? parseUkDate(`${m[2]}/${m[1]}/${m[3]}`) : parseUkDate(text);
    } else iso = parseUkDate(text);
  }
  if (iso && swap) {
    const [y, mo, d] = iso.split("-");
    return parseUkDate(`${mo}/${d}/${y}`);
  }
  return iso;
}

export function parseBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (["y", "yes", "true", "1"].includes(s)) return true;
  if (["n", "no", "false", "0", "none"].includes(s)) return false;
  return undefined;
}

export function parseLicence(value: unknown): "none" | "selective" | "additional" | "hmo" {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("hmo")) return "hmo";
  if (s.includes("additional")) return "additional";
  if (s.includes("selective")) return "selective";
  return "none";
}

export interface ImportRow {
  landlord: string; email?: string; phone?: string; tier: string; overseas: boolean;
  address: string; postcode: string; hasGas: boolean; licence: "none" | "selective" | "additional" | "hmo";
  tenant?: string; tenancyStart?: string; depositReceived?: string;
  gasExpiry?: string; eicrExpiry?: string; epcExpiry?: string; insuranceRenewal?: string; licenceExpiry?: string;
  rtrTimeLimited: boolean; rtrFollowUp?: string;
}

export interface PreviewRow { row: ImportRow; flags: string[]; blocking: boolean }

export const DATE_KEYS = FIELDS.filter((f) => f.type === "date").map((f) => f.key);

export function buildPreview(
  raw: Array<Record<string, unknown>>,
  mapping: Partial<Record<ImportKey, string>>,
  swapped: Partial<Record<ImportKey, boolean>> = {},
): PreviewRow[] {
  const cell = (r: Record<string, unknown>, k: ImportKey) => (mapping[k] ? r[mapping[k]!] : undefined);
  const text = (r: Record<string, unknown>, k: ImportKey) => { const v = cell(r, k); return v === undefined || v === null ? undefined : String(v).trim() || undefined; };
  const seen = new Map<string, number>();
  return raw.map((r) => {
    const flags: string[] = [];
    const dates: Partial<Record<ImportKey, string>> = {};
    for (const k of DATE_KEYS) {
      const v = cell(r, k);
      if (v === undefined || v === null || v === "") continue;
      const iso = parseDateCell(v, swapped[k]);
      if (iso) dates[k] = iso;
      else flags.push(`Can't read ${FIELDS.find((f) => f.key === k)!.label.toLowerCase()} "${String(v)}"`);
    }
    const row: ImportRow = {
      landlord: text(r, "landlord") ?? "", email: text(r, "email"), phone: text(r, "phone"), tier: text(r, "tier") ?? "Full Management",
      overseas: parseBool(cell(r, "overseas")) ?? false, address: text(r, "address") ?? "", postcode: (text(r, "postcode") ?? "").toUpperCase(),
      hasGas: parseBool(cell(r, "hasGas")) ?? true, licence: parseLicence(cell(r, "licence")), tenant: text(r, "tenant"),
      tenancyStart: dates.tenancyStart, depositReceived: dates.depositReceived, gasExpiry: dates.gasExpiry, eicrExpiry: dates.eicrExpiry,
      epcExpiry: dates.epcExpiry, insuranceRenewal: dates.insuranceRenewal, licenceExpiry: dates.licenceExpiry,
      rtrTimeLimited: parseBool(cell(r, "rtrTimeLimited")) ?? false, rtrFollowUp: dates.rtrFollowUp,
    };
    if (!row.landlord) flags.push("No landlord name");
    if (!row.address || !row.postcode) flags.push("No address or postcode");
    if (!row.email) flags.push("No landlord email");
    if (row.tenant && !row.tenancyStart) flags.push("Tenant given but no tenancy start date");
    if (row.rtrTimeLimited && !row.rtrFollowUp) flags.push("Time-limited Right to Rent with no follow-up date");
    const key = `${row.postcode}|${row.address.toLowerCase()}`;
    if (row.postcode && seen.has(key)) flags.push(`Duplicate of row ${seen.get(key)! + 1}`);
    else seen.set(key, seen.size);
    return { row, flags, blocking: !row.landlord || !row.address || !row.postcode };
  });
}

/** "12 Jan 2027": every parsed date is previewed in words so day/month swaps are visible. */
export function inWords(iso?: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export const TEMPLATE_HEADERS = FIELDS.map((f) => f.label);
