// Convex schema (plan §6). Only the tables Phase 1 screens read so far; users, settings,
// jobRuns, activityLogs and graphConnectStates arrive with Steps 1.1b, 1.7 and Phase 2.
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const isoDate = v.string(); // YYYY-MM-DD on the London calendar

export default defineSchema({
  clients: defineTable({
    name: v.string(),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("prospect"), v.literal("former")),
    serviceTier: v.string(),
    isOverseas: v.boolean(),
    isDemo: v.boolean(),
  }).index("by_status", ["status"]).index("by_demo", ["isDemo"]),

  properties: defineTable({
    clientId: v.id("clients"),
    status: v.union(v.literal("onboarding"), v.literal("active"), v.literal("former")),
    addressLine1: v.string(),
    postcode: v.string(),
    area: v.union(v.literal("London"), v.literal("Kent")),
    isDemo: v.boolean(),
  }).index("by_client", ["clientId"]).index("by_demo", ["isDemo"]),

  tenancies: defineTable({
    propertyId: v.id("properties"),
    clientId: v.id("clients"),
    status: v.union(v.literal("active"), v.literal("ended")),
    type: v.literal("assured_periodic"),
    startDate: isoDate,
    startedBefore2026Reform: v.boolean(),
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
    dueDate: v.optional(isoDate),
    satisfiedAt: v.optional(isoDate),
    isNotApplicable: v.boolean(),
    naReason: v.optional(v.string()),
    responsibility: v.union(v.literal("CSPS"), v.literal("Landlord")),
    note: v.optional(v.string()),
    isDemo: v.boolean(),
  }).index("by_property", ["propertyId"]).index("by_client", ["clientId"]).index("by_demo", ["isDemo"]),

  evidence: defineTable({
    obligationId: v.id("obligations"),
    oneDriveFileName: v.optional(v.string()),
    notes: v.optional(v.string()),
    recordedAt: v.number(),
    isDemo: v.boolean(),
  }).index("by_obligation", ["obligationId"]).index("by_demo", ["isDemo"]),

  reminders: defineTable({
    reminderKey: v.string(),
    obligationId: v.id("obligations"),
    stage: v.union(v.literal("30d"), v.literal("14d"), v.literal("7d"), v.literal("overdue"), v.literal("missing")),
    status: v.union(v.literal("reserved"), v.literal("pushing"), v.literal("in_outlook_drafts"), v.literal("sent"), v.literal("dismissed"), v.literal("needs_attention")),
    to: v.string(),
    subject: v.string(),
    createdAt: v.number(),
    isDemo: v.boolean(),
  }).index("by_key", ["reminderKey"]).index("by_status", ["status"]).index("by_demo", ["isDemo"]),

  commitments: defineTable({
    title: v.string(),
    details: v.optional(v.string()),
    ownerType: v.union(v.literal("you"), v.literal("landlord"), v.literal("contractor"), v.literal("tenant")),
    dueDate: v.optional(isoDate),
    lastChasedAt: v.optional(isoDate),
    status: v.union(v.literal("open"), v.literal("waiting"), v.literal("done")),
    isDemo: v.boolean(),
  }).index("by_status", ["status"]).index("by_demo", ["isDemo"]),

  meetings: defineTable({
    title: v.string(),
    scheduledAt: v.string(), // London local "YYYY-MM-DDTHH:mm"
    context: v.string(),
    teamsLabel: v.optional(v.string()),
    isDemo: v.boolean(),
  }).index("by_scheduled_at", ["scheduledAt"]).index("by_demo", ["isDemo"]),

  emails: defineTable({
    subject: v.string(),
    snippet: v.string(),
    status: v.union(v.literal("needs_reply"), v.literal("waiting_reply"), v.literal("reference"), v.literal("resolved")),
    occurredAt: isoDate,
    isDemo: v.boolean(),
  }).index("by_status", ["status"]).index("by_demo", ["isDemo"]),
});
