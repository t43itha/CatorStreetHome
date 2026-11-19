// Fictional London & Kent demo data, normalized like the database (plan Step 1.2).
// Dates are offsets from today so the demo stays meaningful. Keys stand in for ids;
// convex/seed.ts swaps them for real ids on insert, tests use them as ids directly.
import { offset, type Rows } from "./model.ts";

/** The property the Property screen shows until property routes take an id (Step 1.5). */
export const DEMO_PROPERTY = { lewishamLabel: "Flat 3, 22 Lewisham Way SE14" } as const;

export function demoRows(today: string): Rows {
  const d = offset(today);
  const at = (n: number, time: string) => `${d(n)}T${time}`;

  return {
    clients: [
      { _id: "c_shah", name: "David & Priya Shah", status: "active", serviceTier: "Rent Collection", isOverseas: false },
      { _id: "c_okafor", name: "Margaret Okafor", status: "active", serviceTier: "Full Management", isOverseas: false },
      { _id: "c_whitfield", name: "James Whitfield", status: "active", serviceTier: "Full Management", isOverseas: true },
      { _id: "c_adeyemi", name: "Grace Adeyemi", status: "active", serviceTier: "Tenant-Find", isOverseas: false },
      { _id: "c_brennan", name: "Thomas Brennan", status: "prospect", serviceTier: "Property Sourcing", isOverseas: false },
    ],
    properties: [
      { _id: "p_rochester", clientId: "c_shah", addressLine1: "7 Rochester Road, Chatham", postcode: "ME4" },
      { _id: "p_lewisham", clientId: "c_okafor", addressLine1: "Flat 3, 22 Lewisham Way", postcode: "SE14" },
      { _id: "p_cator", clientId: "c_okafor", addressLine1: "14 Cator Street, Peckham", postcode: "SE15" },
      { _id: "p_maidstone", clientId: "c_whitfield", addressLine1: "41 Maidstone Road, Gillingham", postcode: "ME7" },
      { _id: "p_blackheath", clientId: "c_adeyemi", addressLine1: "9 Blackheath Park", postcode: "SE3" },
      { _id: "p_leehigh", clientId: "c_brennan", addressLine1: "Flat 2, 5 Lee High Road", postcode: "SE13" },
    ],
    tenancies: [
      { _id: "t_rochester", propertyId: "p_rochester", status: "active", startDate: d(-320) },
      { _id: "t_lewisham", propertyId: "p_lewisham", status: "active", startDate: d(-158) },
      { _id: "t_cator", propertyId: "p_cator", status: "active", startDate: d(-700), noticeGivenBy: "tenant", expectedEndDate: d(26) },
      { _id: "t_maidstone", propertyId: "p_maidstone", status: "active", startDate: d(-679) },
      { _id: "t_blackheath_old", propertyId: "p_blackheath", status: "ended", startDate: d(-800) },
      { _id: "t_blackheath", propertyId: "p_blackheath", status: "active", startDate: d(-21) },
    ],
    requirementTemplates: [
      { code: "gas", name: "Gas Safety Certificate (CP12)", scope: "property", kind: "renewal", isStatutory: true, group: "Statutory · recurring", icon: "flame" },
      { code: "eicr", name: "EICR", scope: "property", kind: "renewal", isStatutory: true, group: "Statutory · recurring", icon: "bolt" },
      { code: "epc", name: "EPC", scope: "property", kind: "renewal", isStatutory: true, group: "Statutory · recurring", icon: "bolt" },
      { code: "licence", name: "Property licence", scope: "property", kind: "renewal", isStatutory: true, group: "Statutory · recurring", icon: "file" },
      { code: "insurance", name: "Landlord buildings insurance", scope: "property", kind: "renewal", isStatutory: false, group: "Statutory · recurring", icon: "shield" },
      { code: "alarms", name: "Smoke & CO alarm check", scope: "property", kind: "renewal", isStatutory: true, group: "Statutory · recurring", icon: "alert" },
      { code: "rtr", name: "Right to Rent check", scope: "tenancy", kind: "event", isStatutory: true, group: "Tenancy · event-driven", icon: "id" },
      { code: "rtr_follow_up", name: "Right to Rent follow-up", scope: "tenancy", kind: "follow_up", isStatutory: true, group: "Tenancy · event-driven", icon: "id" },
      { code: "deposit", name: "Deposit protection & prescribed information", scope: "tenancy", kind: "event", isStatutory: true, group: "Tenancy · event-driven", icon: "shield" },
      { code: "terms", name: "Written tenancy terms", scope: "tenancy", kind: "event", isStatutory: true, group: "Tenancy · event-driven", icon: "file" },
      // Plan §10: confirm whether How to Rent is still required under the 2026 rules.
      { code: "how_to_rent", name: "How to Rent guide served", scope: "tenancy", kind: "event", isStatutory: false, group: "Tenancy · event-driven", icon: "file" },
      { code: "inventory", name: "Inventory & check-in report", scope: "tenancy", kind: "event", isStatutory: false, group: "Tenancy · event-driven", icon: "file" },
      { code: "eicr_remedial", name: "EICR remedial work", scope: "property", kind: "remedial", isStatutory: true, group: "Statutory · recurring", icon: "bolt" },
      { code: "info_sheet", name: "Information sheet (tenancy existing at 1 May 2026)", scope: "tenancy", kind: "event", isStatutory: true, group: "Tenancy · event-driven", icon: "file" },
      { code: "inspection", name: "Routine inspection", scope: "property", kind: "schedule", isStatutory: false, group: "Operational", icon: "home" },
      { code: "aml", name: "AML / photo ID", scope: "client", kind: "renewal", isStatutory: true, group: "Statutory · recurring", icon: "id" },
    ],
    obligations: [
      // Flat 3, 22 Lewisham Way: the property on the Property screen.
      { _id: "o_lew_eicr", templateCode: "eicr", clientId: "c_okafor", propertyId: "p_lewisham", dueDate: d(5), isNotApplicable: false, responsibility: "CSPS", note: "5-yearly · last: Satisfactory" },
      { _id: "o_lew_gas", templateCode: "gas", clientId: "c_okafor", propertyId: "p_lewisham", dueDate: d(262), isNotApplicable: false, responsibility: "CSPS", note: "12-monthly" },
      { _id: "o_lew_epc", templateCode: "epc", clientId: "c_okafor", propertyId: "p_lewisham", dueDate: d(1595), isNotApplicable: false, responsibility: "CSPS", note: "10-yearly · rating C" },
      { _id: "o_lew_ins", templateCode: "insurance", clientId: "c_okafor", propertyId: "p_lewisham", dueDate: d(51), isNotApplicable: false, responsibility: "Landlord", note: "Landlord policy" },
      { _id: "o_lew_alarms", templateCode: "alarms", clientId: "c_okafor", propertyId: "p_lewisham", dueDate: d(205), isNotApplicable: false, responsibility: "CSPS", note: "Checked at start + annually" },
      { _id: "o_lew_licence", templateCode: "licence", clientId: "c_okafor", propertyId: "p_lewisham", isNotApplicable: true, naReason: "Not in a licensing area", responsibility: "CSPS" },
      { _id: "o_lew_rtr", templateCode: "rtr", clientId: "c_okafor", propertyId: "p_lewisham", satisfiedAt: d(-158), isNotApplicable: false, responsibility: "CSPS", note: "British passport · no follow-up" },
      { _id: "o_lew_deposit", templateCode: "deposit", clientId: "c_okafor", propertyId: "p_lewisham", dueDate: d(-128), satisfiedAt: d(-158), isNotApplicable: false, responsibility: "CSPS", note: "DPS · ref 1204 8873" },
      { _id: "o_lew_terms", templateCode: "terms", clientId: "c_okafor", propertyId: "p_lewisham", satisfiedAt: d(-158), isNotApplicable: false, responsibility: "CSPS", note: "Assured periodic · given before the tenancy" },
      { _id: "o_lew_inventory", templateCode: "inventory", clientId: "c_okafor", propertyId: "p_lewisham", isNotApplicable: false, responsibility: "CSPS", note: "Required for deposit evidence" },
      { _id: "o_lew_htr", templateCode: "how_to_rent", clientId: "c_okafor", propertyId: "p_lewisham", isNotApplicable: false, responsibility: "CSPS", note: "Check it is still required under the 2026 rules" },
      { _id: "o_lew_inspection", templateCode: "inspection", clientId: "c_okafor", propertyId: "p_lewisham", dueDate: d(6), isNotApplicable: false, responsibility: "CSPS", note: "Every 6 months" },
      // Other properties.
      { _id: "o_roc_gas", templateCode: "gas", clientId: "c_shah", propertyId: "p_rochester", dueDate: d(-3), isNotApplicable: false, responsibility: "CSPS" },
      { _id: "o_roc_licence", templateCode: "licence", clientId: "c_shah", propertyId: "p_rochester", dueDate: d(44), isNotApplicable: false, responsibility: "CSPS", note: "Medway selective licence" },
      { _id: "o_mai_rtr", templateCode: "rtr_follow_up", clientId: "c_whitfield", propertyId: "p_maidstone", dueDate: d(6), isNotApplicable: false, responsibility: "CSPS", note: "Time-limited right" },
      { _id: "o_mai_ins", templateCode: "insurance", clientId: "c_whitfield", propertyId: "p_maidstone", dueDate: d(24), isNotApplicable: false, responsibility: "Landlord" },
      { _id: "o_bla_alarms", templateCode: "alarms", clientId: "c_adeyemi", propertyId: "p_blackheath", isNotApplicable: false, responsibility: "CSPS" },
      { _id: "o_bla_deposit", templateCode: "deposit", clientId: "c_adeyemi", propertyId: "p_blackheath", tenancyId: "t_blackheath", dueDate: d(9), isNotApplicable: false, responsibility: "CSPS", note: "30 days from receipt" },
      { _id: "o_bla_epc", templateCode: "epc", clientId: "c_adeyemi", propertyId: "p_blackheath", dueDate: d(57), isNotApplicable: false, responsibility: "CSPS", note: "Current rating D" },
      { _id: "o_cat_gas", templateCode: "gas", clientId: "c_okafor", propertyId: "p_cator", dueDate: d(12), isNotApplicable: false, responsibility: "CSPS" },
      // Failure cases from the 19 Nov 2026 review (plan Step 1.2).
      // A let property with no gas certificate recorded: Missing, and urgent because the property is let.
      { _id: "o_mai_gas", templateCode: "gas", clientId: "c_whitfield", propertyId: "p_maidstone", tenancyId: "t_maidstone", isNotApplicable: false, responsibility: "CSPS", note: "No certificate on file" },
      // An unsatisfactory EICR: remedial work due 28 days after the inspection.
      { _id: "o_mai_remedial", templateCode: "eicr_remedial", clientId: "c_whitfield", propertyId: "p_maidstone", dueDate: d(-2), isNotApplicable: false, responsibility: "CSPS", note: "Report outcome: unsatisfactory" },
      // A tenancy that started before 1 May 2026 owes the information sheet by 31 May 2026.
      { _id: "o_mai_info", templateCode: "info_sheet", clientId: "c_whitfield", propertyId: "p_maidstone", tenancyId: "t_maidstone", dueDate: "2026-05-31", isNotApplicable: false, responsibility: "CSPS", note: "Tenancy started before the 2026 reform" },
      // A time-limited Right to Rent with no follow-up date: Missing, so it reaches Urgent now.
      { _id: "o_bla_rtr_follow", templateCode: "rtr_follow_up", clientId: "c_adeyemi", propertyId: "p_blackheath", tenancyId: "t_blackheath", isNotApplicable: false, responsibility: "CSPS", note: "Time-limited right · follow-up date not entered" },
      // A new tenancy after an old one: the old deposit was done, but it cannot satisfy the new tenancy's deposit.
      { _id: "o_bla_old_deposit", templateCode: "deposit", clientId: "c_adeyemi", propertyId: "p_blackheath", tenancyId: "t_blackheath_old", dueDate: d(-770), satisfiedAt: d(-790), isNotApplicable: false, responsibility: "CSPS" },
      { _id: "o_bre_aml", templateCode: "aml", clientId: "c_brennan", isNotApplicable: false, responsibility: "CSPS" },
      { _id: "o_lee_epc", templateCode: "epc", clientId: "c_brennan", propertyId: "p_leehigh", isNotApplicable: false, responsibility: "CSPS" },
      { _id: "o_lee_inventory", templateCode: "inventory", clientId: "c_brennan", propertyId: "p_leehigh", isNotApplicable: false, responsibility: "CSPS" },
    ],
    evidence: [
      { obligationId: "o_lew_eicr", oneDriveFileName: "EICR_2021.pdf", recordedAt: 1 },
      { obligationId: "o_lew_gas", oneDriveFileName: "CP12_2026.pdf", recordedAt: 1 },
      { obligationId: "o_lew_epc", oneDriveFileName: "EPC.pdf", recordedAt: 1 },
      { obligationId: "o_lew_ins", oneDriveFileName: "Policy.pdf", recordedAt: 1 },
      { obligationId: "o_lew_alarms", oneDriveFileName: "Alarm_log.pdf", recordedAt: 1 },
      { obligationId: "o_lew_rtr", oneDriveFileName: "RTR_check.pdf", recordedAt: 1 },
      { obligationId: "o_lew_deposit", oneDriveFileName: "DPS_cert.pdf", recordedAt: 1 },
      { obligationId: "o_lew_terms", oneDriveFileName: "Tenancy_terms.pdf", recordedAt: 1 },
      { obligationId: "o_lew_inspection", oneDriveFileName: "Inspections/", recordedAt: 1 },
    ],
    reminders: [
      { obligationId: "o_lew_eicr", stage: "7d", status: "reserved", subject: "EICR renewal — 7-day reminder", to: "Margaret Okafor · Flat 3, 22 Lewisham Way" },
      { obligationId: "o_roc_gas", stage: "overdue", status: "reserved", subject: "Gas Safety — overdue notice", to: "David & Priya Shah · 7 Rochester Road" },
      { obligationId: "o_cat_gas", stage: "14d", status: "reserved", subject: "Gas Safety — 14-day reminder", to: "Margaret Okafor · 14 Cator Street" },
    ],
    commitments: [
      { title: "Send Margaret the revised management agreement", details: "Promised in Teams · quarterly review · Owner: you", ownerType: "you", dueDate: d(-4), status: "open" },
      { title: "Book electrician for EICR", details: "Flat 3, 22 Lewisham Way · Owner: you", ownerType: "you", dueDate: d(3), status: "open" },
      { title: "Confirm new rent figure with James", details: "41 Maidstone Road · Owner: you", ownerType: "you", dueDate: d(10), status: "open" },
      { title: "Boiler replacement quote — Kent Heating Ltd", details: "Waiting on contractor · 7 Rochester Road", ownerType: "contractor", lastChasedAt: d(-6), status: "waiting" },
      { title: "Damp survey quote — DryHome Surveys", details: "Waiting on contractor · 9 Blackheath Park", ownerType: "contractor", lastChasedAt: d(-2), status: "waiting" },
      { title: "Signed NRL1 form", details: "Waiting on landlord · James Whitfield", ownerType: "landlord", lastChasedAt: d(-3), status: "waiting" },
      { title: "Proof of ownership", details: "Waiting on landlord · Thomas Brennan", ownerType: "landlord", lastChasedAt: d(-8), status: "waiting" },
      { title: "Meter readings at move-in", details: "Waiting on tenant · Chloe Martin", ownerType: "tenant", lastChasedAt: d(-1), status: "waiting" },
    ],
    meetings: [
      { title: "Quarterly review — James Whitfield", scheduledAt: at(0, "10:30"), context: "41 Maidstone Road · notes captured · 3 actions", teamsLabel: "Teams · done" },
      { title: "Rent review call — Shah", scheduledAt: at(0, "15:00"), context: "7 Rochester Road · bring boiler options", teamsLabel: "Join Teams" },
      { title: "Viewing — Flat 2, 5 Lee High Road", scheduledAt: at(0, "16:30"), context: "Property sourcing · Thomas Brennan (prospect)" },
    ],
    emails: [
      { subject: "Tenant reports damp in bathroom — needs reply", snippet: "From: Chloe Martin · 9 Blackheath Park SE3", status: "needs_reply", occurredAt: d(-2) },
    ],
  };
}
