// Settings defaults (plan Screen 7) and reminder email rendering. Editable in Settings; these apply until saved.
import type { ReminderStage } from "./templates.ts";

export type EmailStage = ReminderStage | "onboarding_request";
export interface EmailTemplate { subject: string; body: string }

export const STAGE_LABEL: Record<EmailStage, string> = {
  "30d": "30-day", "14d": "14-day", "7d": "7-day", overdue: "Overdue", missing: "Missing", onboarding_request: "Onboarding request",
};

export const DEFAULT_TEMPLATES: Record<EmailStage, EmailTemplate> = {
  "30d": {
    subject: "{item} renewal due — {address}",
    body: "Dear {landlord},\n\nOur records show the {item} for {address} is due on {dueDate}, {daysText}.\n\nWe will arrange the renewal unless you would prefer to use your own contractor. Please let me know either way.\n\nKind regards,\nTabitha\nCator Street Property Services",
  },
  "14d": {
    subject: "Reminder: {item} due {dueDate} — {address}",
    body: "Dear {landlord},\n\nA quick reminder that the {item} for {address} is due on {dueDate}, {daysText}.\n\nPlease confirm how you would like us to proceed so the property stays compliant.\n\nKind regards,\nTabitha\nCator Street Property Services",
  },
  "7d": {
    subject: "{item} expires in a week — {address}",
    body: "Dear {landlord},\n\nThe {item} for {address} expires on {dueDate}, {daysText}. We need to book this now to keep the property compliant.\n\nPlease reply today if you would prefer to use your own contractor.\n\nKind regards,\nTabitha\nCator Street Property Services",
  },
  overdue: {
    subject: "Overdue: {item} — {address}",
    body: "Dear {landlord},\n\nThe {item} for {address} expired on {dueDate}. The property is not compliant until it is renewed.\n\nPlease call me today so we can put this right.\n\nKind regards,\nTabitha\nCator Street Property Services",
  },
  missing: {
    subject: "Please send your {item} — {address}",
    body: "Dear {landlord},\n\nWe don't have a {item} on file for {address}. Please send a copy, or let me know if you would like us to arrange one.\n\nKind regards,\nTabitha\nCator Street Property Services",
  },
  onboarding_request: {
    subject: "Documents we need to complete your onboarding",
    body: "Dear {landlord},\n\nThank you for choosing Cator Street. To finish setting you up, please send:\n\n{items}\n\nKind regards,\nTabitha\nCator Street Property Services",
  },
};

export interface JobSettings { scan: string; digest: string; recipient: string }
export const DEFAULT_JOBS: JobSettings = { scan: "07:15", digest: "07:30", recipient: "" };

export interface CadenceSettings { stages: ReminderStage[] }
export const DEFAULT_CADENCE: CadenceSettings = { stages: ["30d", "14d", "7d", "overdue", "missing"] };

export function render(text: string, fields: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (all, key: string) => fields[key] ?? all);
}
