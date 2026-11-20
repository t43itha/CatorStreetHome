// Convex schema (plan §6). users and graphConnectStates arrive with Step 1.1b and Phase 2.
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const isoDate = v.string(); // YYYY-MM-DD on the London calendar

export const licenceType = v.union(v.literal("none"), v.literal("selective"), v.literal("additional"), v.literal("hmo"));
export const reminderStage = v.union(v.literal("30d"), v.literal("14d"), v.literal("7d"), v.literal("overdue"), v.literal("missing"), v.literal("onboarding_request"));
export const ownerType = v.union(v.literal("you"), v.literal("landlord"), v.literal("contractor"), v.literal("tenant"));

export default defineSchema({
  clients: defineTable({
    name: v.string(),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("prospect"), v.literal("former")),
    clientType: v.optional(v.union(v.literal("individual"), v.literal("company"))),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    preferredChannel: v.optional(v.string()),
    serviceTier: v.string(),
    isOverseas: v.boolean(),
    repairLimitGbp: v.optional(v.number()),
    oneDriveFolderUrl: v.optional(v.string()),
    onboardingStartedAt: v.optional(isoDate),
    activatedAt: v.optional(isoDate),
    isDemo: v.boolean(),
  }).index("by_status", ["status"]).index("by_email", ["email"]).index("by_demo", ["isDemo"]),

  properties: defineTable({
    clientId: v.id("clients"),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("former")),
    addressLine1: v.string(),
    postcode: v.string(),
    area: v.union(v.literal("London"), v.literal("Kent")),
    hasGas: v.boolean(),
    licenceType,
    oneDriveFolderUrl: v.optional(v.string()),
    onboardingStartedAt: v.optional(isoDate),
    isDemo: v.boolean(),
  }).index("by_client", ["clientId"]).index("by_postcode", ["postcode"]).index("by_demo", ["isDemo"]),

  tenancies: defineTable({
    propertyId: v.id("properties"),
    clientId: v.id("clients"),
    status: v.union(v.literal("active"), v.literal("ended")),
    type: v.literal("assured_periodic"),
    startedBefore2026Reform: v.boolean(),
    tenants: v.array(v.object({ name: v.string(), email: v.optional(v.string()) })),
    startDate: isoDate,
    rentGbp: v.optional(v.number()),
    depositAmountGbp: v.optional(v.number()),
    depositReceivedDate: v.optional(isoDate),
    depositScheme: v.optional(v.string()),
    noticeGivenBy: v.optional(v.union(v.literal("tenant"), v.literal("landlord"))),
    expectedEndDate: v.optional(isoDate),
    isDemo: v.boolean(),
  }).index("by_property", ["propertyId"]).index("by_demo", ["isDemo"]),

  requirementTemplates: defineTable({
    code: v.string(),
    name: v.string(),
    scope: v.union(v.literal("client"), v.literal("property"), v.literal("tenancy")),
    kind: v.union(v.literal("renewal"), v.literal("event"), v.literal("remedial"), v.literal("follow_up"), v.literal("schedule")),
    isStatutory: v.boolean(),
    group: v.union(v.literal("Statutory · recurring"), v.literal("Tenancy · event-driven"), v.literal("Operational")),
    icon: v.string(),
  }).index("by_code", ["code"]),

  obligations: defineTable({
    templateCode: v.string(),
    clientId: v.id("clients"),
    propertyId: v.optional(v.id("properties")),
    tenancyId: v.optional(v.id("tenancies")),
    parentObligationId: v.optional(v.id("obligations")),
    dueDate: v.optional(isoDate),
    satisfiedAt: v.optional(isoDate),
    isNotApplicable: v.boolean(),
    naReason: v.optional(v.string()),
    disposition: v.optional(v.union(v.literal("request_from_landlord"), v.literal("unknown"))),
    responsibility: v.union(v.literal("CSPS"), v.literal("Landlord")),
    note: v.optional(v.string()),
    isDemo: v.boolean(),
  }).index("by_property", ["propertyId"]).index("by_client", ["clientId"]).index("by_tenancy", ["tenancyId"]).index("by_demo", ["isDemo"]),

  evidence: defineTable({
    obligationId: v.id("obligations"),
    issueDate: v.optional(isoDate),
    expiryDate: v.optional(isoDate),
    outcome: v.optional(v.union(v.literal("satisfactory"), v.literal("unsatisfactory"))),
    reportRemedialDate: v.optional(isoDate),
    rightType: v.optional(v.union(v.literal("unlimited"), v.literal("time_limited"))),
    followUpDate: v.optional(isoDate),
    oneDriveFileName: v.optional(v.string()),
    notes: v.optional(v.string()),
    recordedAt: v.number(),
    isDemo: v.boolean(),
  }).index("by_obligation", ["obligationId"]).index("by_demo", ["isDemo"]),

  reminders: defineTable({
    reminderKey: v.string(),
    obligationId: v.optional(v.id("obligations")),
    clientId: v.optional(v.id("clients")),
    stage: reminderStage,
    status: v.union(v.literal("reserved"), v.literal("pushing"), v.literal("in_outlook_drafts"), v.literal("sent"), v.literal("dismissed"), v.literal("needs_attention")),
    to: v.string(),
    toEmail: v.optional(v.string()),
    subject: v.string(),
    body: v.optional(v.string()),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
    isDemo: v.boolean(),
  }).index("by_key", ["reminderKey"]).index("by_status", ["status"]).index("by_demo", ["isDemo"]),

  commitments: defineTable({
    title: v.string(),
    details: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    propertyId: v.optional(v.id("properties")),
    obligationId: v.optional(v.id("obligations")),
    ownerType,
    waitingOn: v.optional(v.string()),
    dueDate: v.optional(isoDate),
    lastChasedAt: v.optional(isoDate),
    status: v.union(v.literal("open"), v.literal("waiting"), v.literal("done")),
    sourceType: v.optional(v.union(v.literal("meeting"), v.literal("email"), v.literal("compliance"), v.literal("manual"))),
    sourceId: v.optional(v.string()),
    completedAt: v.optional(isoDate),
    isDemo: v.boolean(),
  }).index("by_status", ["status"]).index("by_client", ["clientId"]).index("by_property", ["propertyId"]).index("by_demo", ["isDemo"]),

  meetings: defineTable({
    title: v.string(),
    scheduledAt: v.string(), // London local "YYYY-MM-DDTHH:mm"
    context: v.string(),
    teamsLabel: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    propertyId: v.optional(v.id("properties")),
    notes: v.optional(v.string()),
    decisions: v.optional(v.array(v.string())),
    isDemo: v.boolean(),
  }).index("by_scheduled_at", ["scheduledAt"]).index("by_demo", ["isDemo"]),

  emails: defineTable({
    subject: v.string(),
    snippet: v.string(),
    clientId: v.optional(v.id("clients")),
    propertyId: v.optional(v.id("properties")),
    status: v.union(v.literal("needs_reply"), v.literal("waiting_reply"), v.literal("reference"), v.literal("resolved")),
    occurredAt: isoDate,
    isDemo: v.boolean(),
  }).index("by_status", ["status"]).index("by_demo", ["isDemo"]),

  settings: defineTable({
    key: v.union(v.literal("cadence"), v.literal("templates"), v.literal("jobs")),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  jobRuns: defineTable({
    job: v.union(v.literal("scan"), v.literal("digest")),
    londonDate: isoDate,
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    result: v.optional(v.string()),
  }).index("by_job_date", ["job", "londonDate"]),

  activityLogs: defineTable({
    entityType: v.string(),
    entityId: v.string(),
    clientId: v.optional(v.id("clients")),
    propertyId: v.optional(v.id("properties")),
    action: v.string(),
    summary: v.string(),
    createdAt: v.number(),
    isDemo: v.boolean(),
  }).index("by_client", ["clientId"]).index("by_property", ["propertyId"]).index("by_created_at", ["createdAt"]),
});
