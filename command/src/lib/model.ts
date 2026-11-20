// The screen-facing data shape (CommandData) and the one adapter that builds it from stored rows.
// Pure: Convex calls it with database documents, tests call it with seed rows.
import { addDays, formatShortDate, status } from "./status.ts";

export type IconName =
  | "home" | "users" | "building" | "list" | "cal" | "mail" | "upload" | "cog" | "search" | "plus"
  | "alert" | "clock" | "arrow" | "file" | "flame" | "bolt" | "id" | "shield" | "chat"
  | "check" | "ext" | "phone" | "pin" | "send" | "onedrive";

export type MatrixGroup = "Statutory · recurring" | "Tenancy · event-driven" | "Operational";

// ---- Screen-facing shape ----

export interface ComplianceItem {
  id: string;
  clientId: string;
  templateCode: string;
  label: string;
  icon: IconName;
  scope: "client" | "property" | "tenancy";
  propertyId?: string;
  where: string;
  landlord: string;
  dueDate?: string;
  satisfiedAt?: string;
  isNotApplicable?: boolean;
  isStatutory: boolean;
  propertyLet: boolean;
  actions: string[];
  matrix?: { group: MatrixGroup; meta: string; file?: string; owner: string; expires?: string };
}

export interface Commitment {
  id: string;
  title: string;
  context: string;
  owner: "you" | "landlord" | "contractor" | "tenant";
  dueDate?: string;
  lastChasedAt?: string;
}

export interface LoggedEmail { id: string; subject: string; context: string; loggedOn: string }
export interface Milestone { label: string; context: string; date: string; tag: "Visit" | "Tenancy"; icon: IconName }
export interface Meeting { id: string; time: string; title: string; context: string; teams?: string }
export interface Draft { id: string; title: string; to: string; tone: "overdue" | "urgent" | "soon" }

export interface CommandData {
  compliance: ComplianceItem[];
  commitments: Commitment[];
  emails: LoggedEmail[];
  milestones: Milestone[];
  meetings: Meeting[];
  drafts: Draft[];
}

// ---- Stored rows (structurally compatible with Convex documents) ----

export interface Rows {
  clients: Array<{ _id: string; name: string; status: "onboarding" | "active" | "prospect" | "former"; serviceTier: string; isOverseas: boolean; email?: string; phone?: string }>;
  properties: Array<{ _id: string; clientId: string; addressLine1: string; postcode: string; hasGas?: boolean; licenceType?: "none" | "selective" | "additional" | "hmo"; status?: "onboarding" | "active" | "former" }>;
  tenancies: Array<{ _id: string; propertyId: string; status: "active" | "ended"; startDate: string; tenants?: Array<{ name: string; email?: string }>; rentGbp?: number; depositAmountGbp?: number; depositReceivedDate?: string; depositScheme?: string; noticeGivenBy?: "tenant" | "landlord"; expectedEndDate?: string }>;
  requirementTemplates: Array<{ code: string; name: string; scope: "client" | "property" | "tenancy"; kind: "renewal" | "event" | "remedial" | "follow_up" | "schedule"; isStatutory: boolean; group: MatrixGroup; icon: string }>;
  obligations: Array<{ _id: string; templateCode: string; clientId: string; propertyId?: string; tenancyId?: string; dueDate?: string; satisfiedAt?: string; isNotApplicable: boolean; naReason?: string; responsibility: "CSPS" | "Landlord"; note?: string }>;
  evidence: Array<{ obligationId: string; oneDriveFileName?: string; recordedAt: number }>;
  reminders: Array<{ _id: string; obligationId?: string; stage: "30d" | "14d" | "7d" | "overdue" | "missing" | "onboarding_request"; status: string; to: string; subject: string; body?: string }>;
  commitments: Array<{ _id: string; title: string; details?: string; clientId?: string; propertyId?: string; ownerType: Commitment["owner"]; dueDate?: string; lastChasedAt?: string; status: "open" | "waiting" | "done" }>;
  meetings: Array<{ _id: string; title: string; scheduledAt: string; clientId?: string; notes?: string; decisions?: string[]; context: string; teamsLabel?: string }>;
  emails: Array<{ _id: string; subject: string; snippet: string; status: string; occurredAt: string }>;
}

const DRAFT_STATUSES = new Set(["reserved", "pushing", "in_outlook_drafts", "needs_attention"]);
const TONE: Record<Rows["reminders"][number]["stage"], Draft["tone"]> = { overdue: "overdue", "7d": "urgent", "14d": "soon", "30d": "soon", missing: "overdue", onboarding_request: "soon" };

function homeActions(s: ReturnType<typeof status>): string[] {
  if (s === "overdue" || s === "urgent") return ["Draft email", "Record evidence"];
  if (s === "missing") return ["Record evidence"];
  return [];
}

export function toCommandData(rows: Rows, today: string): CommandData {
  const client = new Map(rows.clients.map((c) => [c._id, c]));
  const property = new Map(rows.properties.map((p) => [p._id, p]));
  const template = new Map(rows.requirementTemplates.map((t) => [t.code, t]));
  const letProperties = new Set(rows.tenancies.filter((t) => t.status === "active").map((t) => t.propertyId));
  const fileFor = new Map<string, string>();
  for (const e of [...rows.evidence].sort((a, b) => a.recordedAt - b.recordedAt)) {
    if (e.oneDriveFileName) fileFor.set(e.obligationId, e.oneDriveFileName);
  }
  const where = (p: Rows["properties"][number]) => `${p.addressLine1} ${p.postcode}`;
  const landlordLabel = (c: Rows["clients"][number]) => `${c.name}${c.isOverseas ? " (overseas)" : ""} · ${c.serviceTier}`;

  // Obligations of an ended tenancy are history: they never satisfy or alert for the current one.
  const endedTenancies = new Set(rows.tenancies.filter((t) => t.status === "ended").map((t) => t._id));
  const compliance: ComplianceItem[] = rows.obligations.filter((o) => !o.tenancyId || !endedTenancies.has(o.tenancyId)).map((o) => {
    const t = template.get(o.templateCode);
    if (!t) throw new Error(`Unknown requirement template: ${o.templateCode}`);
    const c = client.get(o.clientId)!;
    const p = o.propertyId ? property.get(o.propertyId) : undefined;
    const s = status(o, today);
    return {
      id: o._id,
      clientId: o.clientId,
      templateCode: o.templateCode,
      label: t.name,
      icon: t.icon as IconName,
      scope: t.scope,
      propertyId: o.propertyId,
      where: p ? where(p) : c.name,
      landlord: p ? landlordLabel(c) : c.status[0].toUpperCase() + c.status.slice(1),
      dueDate: o.dueDate,
      satisfiedAt: o.satisfiedAt,
      isNotApplicable: o.isNotApplicable,
      isStatutory: t.isStatutory,
      propertyLet: p ? letProperties.has(p._id) : false,
      actions: homeActions(s),
      matrix: p ? {
        group: t.group,
        meta: o.isNotApplicable ? (o.naReason ?? "Not applicable") : (o.note ?? ""),
        file: fileFor.get(o._id),
        owner: o.isNotApplicable ? "—" : o.responsibility,
        expires: o.satisfiedAt ? `Done ${formatShortDate(o.satisfiedAt)}` : undefined,
      } : undefined,
    };
  });

  const commitments: Commitment[] = rows.commitments
    .filter((c) => c.status !== "done")
    .map((c) => ({ id: c._id, title: c.title, context: c.details ?? "", owner: c.ownerType, dueDate: c.dueDate, lastChasedAt: c.lastChasedAt }));

  const emails: LoggedEmail[] = rows.emails
    .filter((e) => e.status === "needs_reply")
    .map((e) => ({ id: e._id, subject: e.subject, context: e.snippet, loggedOn: e.occurredAt }));

  const milestones: Milestone[] = rows.tenancies
    .filter((t) => t.status === "active" && t.expectedEndDate)
    .map((t) => ({
      label: "Tenancy notice period ends",
      context: `${where(property.get(t.propertyId)!)} · notice given by ${t.noticeGivenBy ?? "—"}`,
      date: t.expectedEndDate!,
      tag: "Tenancy",
      icon: "cal",
    }));

  const meetings: Meeting[] = rows.meetings
    .filter((m) => m.scheduledAt.startsWith(today))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .map((m) => ({ id: m._id, time: m.scheduledAt.slice(11, 16), title: m.title, context: m.context, teams: m.teamsLabel }));

  const drafts: Draft[] = rows.reminders
    .filter((r) => DRAFT_STATUSES.has(r.status))
    .map((r) => ({ id: r._id, title: r.subject, to: r.to, tone: TONE[r.stage] }));

  return { compliance, commitments, emails, milestones, meetings, drafts };
}

/** Days from today, for seed data that should stay fresh. */
export const offset = (today: string) => (n: number) => addDays(today, n);
