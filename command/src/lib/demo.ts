// Fictional London & Kent demo data. Dates are offsets from today so the demo stays meaningful.
// Replaced by the Convex seed (plan Step 1.2).
import { addDays } from "./status.ts";

export type IconName =
  | "home" | "users" | "building" | "list" | "cal" | "mail" | "upload" | "cog" | "search" | "plus"
  | "alert" | "clock" | "arrow" | "file" | "flame" | "bolt" | "id" | "shield" | "chat"
  | "check" | "ext" | "phone" | "pin" | "send" | "onedrive";

export interface ComplianceItem {
  label: string;
  icon: IconName;
  scope: "client" | "property" | "tenancy";
  where: string;
  landlord: string;
  dueDate?: string;
  isStatutory: boolean;
  propertyLet: boolean;
  actions: string[];
  satisfiedAt?: string;
  isNotApplicable?: boolean;
  /** Property page matrix only. */
  matrix?: { group: "Statutory · recurring" | "Tenancy · event-driven" | "Operational"; meta: string; file?: string; owner: string; expires?: string; actions?: string[] };
}

export const LEWISHAM = "Flat 3, 22 Lewisham Way SE14";

export interface Commitment {
  title: string;
  context: string;
  owner: "you" | "landlord" | "contractor" | "tenant";
  dueDate?: string;
  lastChasedAt?: string;
}

export interface LoggedEmail { subject: string; context: string; loggedOn: string }
export interface Milestone { label: string; context: string; date: string; tag: "Visit" | "Tenancy"; icon: IconName }
export interface Meeting { time: string; title: string; context: string; teams?: string }
export interface Draft { title: string; to: string; tone: "overdue" | "urgent" | "soon" }

export function buildDemo(today: string) {
  const d = (n: number) => addDays(today, n);

  const compliance: ComplianceItem[] = [
    // Flat 3, 22 Lewisham Way: the property shown on the Property screen.
    { label: "EICR", icon: "bolt", scope: "property", where: LEWISHAM, landlord: "Margaret Okafor · Full Management", dueDate: d(5), isStatutory: true, propertyLet: true, actions: ["Review draft", "Record evidence"], matrix: { group: "Statutory · recurring", meta: "5-yearly · last: Satisfactory", file: "EICR_2021.pdf", owner: "CSPS", actions: ["Draft", "Renewed"] } },
    { label: "Gas Safety (CP12)", icon: "flame", scope: "property", where: LEWISHAM, landlord: "Margaret Okafor", dueDate: d(262), isStatutory: true, propertyLet: true, actions: ["History"], matrix: { group: "Statutory · recurring", meta: "12-monthly", file: "CP12_2026.pdf", owner: "CSPS" } },
    { label: "EPC", icon: "bolt", scope: "property", where: LEWISHAM, landlord: "Margaret Okafor", dueDate: d(1595), isStatutory: true, propertyLet: true, actions: ["History"], matrix: { group: "Statutory · recurring", meta: "10-yearly · rating C", file: "EPC.pdf", owner: "CSPS" } },
    { label: "Buildings insurance", icon: "shield", scope: "property", where: LEWISHAM, landlord: "Margaret Okafor", dueDate: d(51), isStatutory: false, propertyLet: true, actions: ["Remind"], matrix: { group: "Statutory · recurring", meta: "Landlord policy", file: "Policy.pdf", owner: "Landlord" } },
    { label: "Smoke & CO alarms", icon: "alert", scope: "property", where: LEWISHAM, landlord: "Margaret Okafor", dueDate: d(205), isStatutory: true, propertyLet: true, actions: ["History"], matrix: { group: "Statutory · recurring", meta: "Checked at start + annually", file: "Alarm_log.pdf", owner: "CSPS" } },
    { label: "Property licence", icon: "file", scope: "property", where: LEWISHAM, landlord: "Margaret Okafor", isNotApplicable: true, isStatutory: true, propertyLet: true, actions: ["Edit"], matrix: { group: "Statutory · recurring", meta: "Not in a licensing area", owner: "—" } },
    { label: "Right to Rent", icon: "id", scope: "tenancy", where: LEWISHAM, landlord: "Margaret Okafor", satisfiedAt: d(-158), isStatutory: true, propertyLet: true, actions: [], matrix: { group: "Tenancy · event-driven", meta: "British passport · no follow-up", file: "RTR_check.pdf", owner: "CSPS", expires: "One-off" } },
    { label: "Deposit + prescribed info", icon: "shield", scope: "tenancy", where: LEWISHAM, landlord: "Margaret Okafor", dueDate: d(-128), satisfiedAt: d(-158), isStatutory: true, propertyLet: true, actions: [], matrix: { group: "Tenancy · event-driven", meta: "DPS · ref 1204 8873", file: "DPS_cert.pdf", owner: "CSPS", expires: "Served 14 Jun" } },
    { label: "Written tenancy terms", icon: "file", scope: "tenancy", where: LEWISHAM, landlord: "Margaret Okafor", satisfiedAt: d(-158), isStatutory: true, propertyLet: true, actions: [], matrix: { group: "Tenancy · event-driven", meta: "Assured periodic · given before 14 Jun 2026", file: "Tenancy_terms.pdf", owner: "CSPS" } },
    { label: "Inventory & check-in", icon: "file", scope: "tenancy", where: LEWISHAM, landlord: "Margaret Okafor", isStatutory: false, propertyLet: true, actions: ["Add"], matrix: { group: "Tenancy · event-driven", meta: "Required for deposit evidence", owner: "CSPS" } },
    { label: "How to Rent guide served", icon: "file", scope: "tenancy", where: LEWISHAM, landlord: "Margaret Okafor", isStatutory: false, propertyLet: true, actions: ["Add"], matrix: { group: "Tenancy · event-driven", meta: "Check it is still required under the 2026 rules", owner: "CSPS" } },
    { label: "Routine inspection", icon: "home", scope: "property", where: LEWISHAM, landlord: "Margaret Okafor", dueDate: d(6), isStatutory: false, propertyLet: true, actions: ["Book"], matrix: { group: "Operational", meta: "Every 6 months", file: "Inspections/", owner: "CSPS" } },
    { label: "Gas Safety Certificate (CP12)", icon: "flame", scope: "property", where: "7 Rochester Road, Chatham ME4", landlord: "David & Priya Shah · Rent Collection", dueDate: d(-3), isStatutory: true, propertyLet: true, actions: ["Draft email", "Record evidence"] },
    { label: "Right to Rent follow-up", icon: "id", scope: "tenancy", where: "41 Maidstone Road, Gillingham ME7", landlord: "James Whitfield (overseas)", dueDate: d(6), isStatutory: true, propertyLet: true, actions: ["Log chase"] },
    { label: "Smoke & CO alarm check", icon: "alert", scope: "property", where: "9 Blackheath Park SE3", landlord: "Grace Adeyemi · Tenant-Find", isStatutory: true, propertyLet: true, actions: ["Record evidence"] },
    { label: "Deposit protection & prescribed information", icon: "shield", scope: "tenancy", where: "9 Blackheath Park SE3", landlord: "Grace Adeyemi · 30 days from receipt", dueDate: d(9), isStatutory: true, propertyLet: true, actions: [] },
    { label: "Gas Safety Certificate (CP12)", icon: "flame", scope: "property", where: "14 Cator Street, Peckham SE15", landlord: "Margaret Okafor", dueDate: d(12), isStatutory: true, propertyLet: true, actions: [] },
    { label: "Landlord buildings insurance", icon: "shield", scope: "property", where: "41 Maidstone Road, Gillingham ME7", landlord: "James Whitfield", dueDate: d(24), isStatutory: false, propertyLet: true, actions: [] },
    { label: "Selective licence renewal (Medway)", icon: "file", scope: "property", where: "7 Rochester Road, Chatham ME4", landlord: "David & Priya Shah", dueDate: d(44), isStatutory: true, propertyLet: true, actions: [] },
    { label: "EPC (current rating D)", icon: "bolt", scope: "property", where: "9 Blackheath Park SE3", landlord: "Grace Adeyemi · Tenant-Find", dueDate: d(57), isStatutory: true, propertyLet: true, actions: [] },
    { label: "AML / photo ID", icon: "id", scope: "client", where: "Thomas Brennan", landlord: "Prospect", isStatutory: true, propertyLet: false, actions: [] },
    { label: "EPC", icon: "bolt", scope: "property", where: "Flat 2, 5 Lee High Road SE13", landlord: "Thomas Brennan · vacant", isStatutory: true, propertyLet: false, actions: [] },
    { label: "Inventory & check-in report", icon: "file", scope: "property", where: "Flat 2, 5 Lee High Road SE13", landlord: "Thomas Brennan · vacant", isStatutory: false, propertyLet: false, actions: [] },
  ];

  const commitments: Commitment[] = [
    { title: "Send Margaret the revised management agreement", context: "Promised in Teams · quarterly review · Owner: you", owner: "you", dueDate: d(-4) },
    { title: "Book electrician for EICR", context: "Flat 3, 22 Lewisham Way · Owner: you", owner: "you", dueDate: d(3) },
    { title: "Confirm new rent figure with James", context: "41 Maidstone Road · Owner: you", owner: "you", dueDate: d(10) },
    { title: "Boiler replacement quote — Kent Heating Ltd", context: "Waiting on contractor · 7 Rochester Road", owner: "contractor", lastChasedAt: d(-6) },
    { title: "Damp survey quote — DryHome Surveys", context: "Waiting on contractor · 9 Blackheath Park", owner: "contractor", lastChasedAt: d(-2) },
    { title: "Signed NRL1 form", context: "Waiting on landlord · James Whitfield", owner: "landlord", lastChasedAt: d(-3) },
    { title: "Proof of ownership", context: "Waiting on landlord · Thomas Brennan", owner: "landlord", lastChasedAt: d(-8) },
    { title: "Meter readings at move-in", context: "Waiting on tenant · Chloe Martin", owner: "tenant", lastChasedAt: d(-1) },
  ];

  const emails: LoggedEmail[] = [
    { subject: "Tenant reports damp in bathroom — needs reply", context: "From: Chloe Martin · 9 Blackheath Park SE3", loggedOn: d(-2) },
  ];

  const milestones: Milestone[] = [
    { label: "Tenant notice period ends", context: "14 Cator Street, Peckham SE15 · notice given by tenant", date: d(26), tag: "Tenancy", icon: "cal" },
    { label: "Rent review — agreed increase takes effect", context: "41 Maidstone Road, Gillingham ME7 · James Whitfield", date: d(51), tag: "Tenancy", icon: "cal" },
  ];

  const meetings: Meeting[] = [
    { time: "10:30", title: "Quarterly review — James Whitfield", context: "41 Maidstone Road · notes captured · 3 actions", teams: "Teams · done" },
    { time: "15:00", title: "Rent review call — Shah", context: "7 Rochester Road · bring boiler options", teams: "Join Teams" },
    { time: "16:30", title: "Viewing — Flat 2, 5 Lee High Road", context: "Property sourcing · Thomas Brennan (prospect)" },
  ];

  const drafts: Draft[] = [
    { title: "EICR renewal — 7-day reminder", to: "Margaret Okafor · Flat 3, 22 Lewisham Way", tone: "urgent" },
    { title: "Gas Safety — overdue notice", to: "David & Priya Shah · 7 Rochester Road", tone: "overdue" },
    { title: "Gas Safety — 14-day reminder", to: "Margaret Okafor · 14 Cator Street", tone: "soon" },
  ];

  return { compliance, commitments, emails, milestones, meetings, drafts };
}
