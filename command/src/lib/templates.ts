// Requirement templates and the rules that turn facts about a client, property or tenancy into
// obligations (plan §5.1, Screen 2b). Pure: Convex mutations, the importer and the seed all call it.
import { addDays, diffCalendarDays, status } from "./status.ts";
import type { MatrixGroup } from "./model.ts";

export type TemplateScope = "client" | "property" | "tenancy";
export type TemplateKind = "renewal" | "event" | "remedial" | "follow_up" | "schedule";

export interface Template {
  code: string;
  name: string;
  scope: TemplateScope;
  kind: TemplateKind;
  isStatutory: boolean;
  group: MatrixGroup;
  icon: string;
}

const T = (code: string, name: string, scope: TemplateScope, kind: TemplateKind, isStatutory: boolean, group: MatrixGroup, icon: string): Template =>
  ({ code, name, scope, kind, isStatutory, group, icon });
const S: MatrixGroup = "Statutory · recurring", E: MatrixGroup = "Tenancy · event-driven", O: MatrixGroup = "Operational";

export const TEMPLATES: Template[] = [
  T("gas", "Gas Safety Certificate (CP12)", "property", "renewal", true, S, "flame"),
  T("eicr", "EICR", "property", "renewal", true, S, "bolt"),
  T("eicr_remedial", "EICR remedial work", "property", "remedial", true, S, "bolt"),
  T("epc", "EPC", "property", "renewal", true, S, "bolt"),
  T("licence", "Property licence", "property", "renewal", true, S, "file"),
  T("insurance", "Landlord buildings insurance", "property", "renewal", false, S, "shield"),
  T("alarms", "Smoke & CO alarm check", "property", "renewal", true, S, "alert"),
  T("proof_ownership", "Proof of ownership", "property", "event", false, S, "file"),
  T("inspection", "Routine inspection", "property", "schedule", false, O, "home"),
  T("rtr", "Right to Rent check", "tenancy", "event", true, E, "id"),
  T("rtr_follow_up", "Right to Rent follow-up", "tenancy", "follow_up", true, E, "id"),
  T("deposit", "Deposit protection & prescribed information", "tenancy", "event", true, E, "shield"),
  T("terms", "Written tenancy terms", "tenancy", "event", true, E, "file"),
  T("info_sheet", "Information sheet (tenancy existing at 1 May 2026)", "tenancy", "event", true, E, "file"),
  // Plan §10: confirm whether How to Rent is still required under the 2026 rules.
  T("how_to_rent", "How to Rent guide served", "tenancy", "event", false, E, "file"),
  T("inventory", "Inventory & check-in report", "tenancy", "event", false, E, "file"),
  T("aml", "AML / photo ID", "client", "renewal", true, S, "id"),
  T("proof_address", "Proof of address", "client", "event", false, S, "file"),
  T("terms_of_business", "Signed terms of business", "client", "event", false, S, "file"),
  T("rent_mandate", "Rent remittance mandate", "client", "event", false, S, "file"),
  T("nrl1", "NRL1 approval (non-resident landlord)", "client", "event", true, S, "file"),
];

export const TEMPLATE = new Map(TEMPLATES.map((t) => [t.code, t]));

export const REFORM_DATE = "2026-05-01";
export const INFO_SHEET_DUE = "2026-05-31";
export const DEPOSIT_DAYS = 30;

export type LicenceType = "none" | "selective" | "additional" | "hmo";

export interface ObligationDraft {
  templateCode: string;
  dueDate?: string;
  isNotApplicable: boolean;
  naReason?: string;
}

const draft = (templateCode: string, extra: Partial<ObligationDraft> = {}): ObligationDraft => ({ templateCode, isNotApplicable: false, ...extra });

export function clientObligations(facts: { isOverseas: boolean }): ObligationDraft[] {
  return [
    draft("aml"), draft("proof_address"), draft("terms_of_business"), draft("rent_mandate"),
    facts.isOverseas ? draft("nrl1") : draft("nrl1", { isNotApplicable: true, naReason: "UK resident" }),
  ];
}

export function propertyObligations(facts: { hasGas: boolean; licenceType: LicenceType }): ObligationDraft[] {
  return [
    facts.hasGas ? draft("gas") : draft("gas", { isNotApplicable: true, naReason: "No gas supply" }),
    draft("eicr"), draft("epc"),
    facts.licenceType === "none" ? draft("licence", { isNotApplicable: true, naReason: "Not in a licensing area" }) : draft("licence"),
    draft("insurance"), draft("alarms"), draft("proof_ownership"), draft("inspection"),
  ];
}

export function startedBefore2026Reform(startDate: string): boolean {
  return startDate < REFORM_DATE;
}

export function tenancyObligations(facts: { startDate: string; depositReceivedDate?: string }): ObligationDraft[] {
  const list = [
    draft("rtr", { dueDate: facts.startDate }),
    // Due 30 days after the deposit is received; Missing until that date is entered.
    draft("deposit", { dueDate: facts.depositReceivedDate ? addDays(facts.depositReceivedDate, DEPOSIT_DAYS) : undefined }),
    draft("terms", { dueDate: facts.startDate }),
    draft("how_to_rent", { dueDate: facts.startDate }),
    draft("inventory", { dueDate: facts.startDate }),
  ];
  if (startedBefore2026Reform(facts.startDate)) list.push(draft("info_sheet", { dueDate: INFO_SHEET_DUE }));
  return list;
}

// ---- Reminder stages (plan §5.4) ----

export type ReminderStage = "30d" | "14d" | "7d" | "overdue" | "missing";

/** The reminder stage an open obligation has reached today, or null when no reminder is due. */
export function reminderStage(
  o: { dueDate?: string; satisfiedAt?: string; isNotApplicable?: boolean },
  today: string,
  ctx: { isStatutory: boolean; propertyLet: boolean },
): ReminderStage | null {
  const s = status(o, today);
  if (s === "missing") return ctx.isStatutory && ctx.propertyLet ? "missing" : null;
  if (s === "overdue") return "overdue";
  if (!o.dueDate || s === "done" || s === "na") return null;
  const days = diffCalendarDays(o.dueDate, today);
  if (days <= 7) return "7d";
  if (days <= 14) return "14d";
  if (days <= 30) return "30d";
  return null;
}
