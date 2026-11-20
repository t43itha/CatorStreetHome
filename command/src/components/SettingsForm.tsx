"use client";

import { useState } from "react";
import { useAct } from "./Act.tsx";
import { render, STAGE_LABEL, type CadenceSettings, type EmailStage, type EmailTemplate, type JobSettings } from "@/lib/emailTemplates.ts";
import type { ReminderStage } from "@/lib/templates.ts";

const SAMPLE = { landlord: "Margaret", item: "EICR", address: "Flat 3, 22 Lewisham Way, SE14", dueDate: "24 Nov", daysText: "in 5 days", items: "• Proof of address\n• Buildings insurance policy" };
const STAGES: ReminderStage[] = ["30d", "14d", "7d", "overdue", "missing"];

export function SettingsForm({ initial }: { initial: { cadence: CadenceSettings; templates: Record<EmailStage, EmailTemplate>; jobs: JobSettings } }) {
  const [jobs, setJobs] = useState(initial.jobs);
  const [cadence, setCadence] = useState(initial.cadence);
  const [templates, setTemplates] = useState(initial.templates);
  const [stage, setStage] = useState<EmailStage>("30d");
  const save = useAct("settings:save");
  const scan = useAct("reminders:runScan");
  const reset = useAct("demo:reset");
  const clear = useAct("demo:clear");
  const t = templates[stage];

  return (
    <>
      <div className="page-head"><div><span className="eyebrow">Admin</span><h1 className="page">Settings</h1><p className="lede">Reminder cadence, email templates, daily job times and demo data.</p></div></div>
      <div className="two">
        <div className="stack">
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Email templates</h2><div className="sub">Merge fields: {"{landlord} {item} {address} {dueDate} {daysText}"} (and {"{items}"} for onboarding)</div></div></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="segs" style={{ flexWrap: "wrap" }}>{(Object.keys(STAGE_LABEL) as EmailStage[]).map((s) => <button key={s} className={`seg${s === stage ? " on" : ""}`} onClick={() => setStage(s)}>{STAGE_LABEL[s]}</button>)}</div>
              <div className="form-row"><label>Subject<input value={t.subject} onChange={(e) => setTemplates({ ...templates, [stage]: { ...t, subject: e.target.value } })} /></label></div>
              <div className="form-row"><label>Body<textarea style={{ minHeight: 220 }} value={t.body} onChange={(e) => setTemplates({ ...templates, [stage]: { ...t, body: e.target.value } })} /></label></div>
              <div className="context-box" style={{ display: "block" }}><b>Preview:</b> {render(t.subject, SAMPLE)}<div style={{ whiteSpace: "pre-line", marginTop: 8 }}>{render(t.body, SAMPLE)}</div></div>
              <div><button className="btn btn-primary" disabled={save.busy} onClick={() => save.act({ key: "templates", value: templates }, "Templates saved").catch(() => {})}>Save templates</button></div>
            </div>
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Daily jobs</h2><div className="sub">Europe/London time · applies from the next day</div></div></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="form-grid">
                <div className="form-row"><label>Compliance check<input type="time" value={jobs.scan} onChange={(e) => setJobs({ ...jobs, scan: e.target.value })} /></label></div>
                <div className="form-row"><label>Morning digest<input type="time" value={jobs.digest} onChange={(e) => setJobs({ ...jobs, digest: e.target.value })} /></label></div>
              </div>
              <div className="form-row"><label>Digest recipient<input type="email" value={jobs.recipient} onChange={(e) => setJobs({ ...jobs, recipient: e.target.value })} /></label></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-primary" disabled={save.busy} onClick={() => save.act({ key: "jobs", value: jobs }, "Job times saved").catch(() => {})}>Save</button>
                <button className="btn btn-ghost" disabled={scan.busy} onClick={() => scan.act({}).then((r) => alert(`Compliance check done: ${(r as { reserved: number }).reserved} new reminder drafts.`)).catch(() => {})}>Run compliance check now</button>
              </div>
              <p className="lede" style={{ fontSize: 12.5 }}>The scheduled run and the emailed digest arrive with Microsoft 365 in Phase 2. Until then, run the check here.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Reminder cadence</h2><div className="sub">Which stages create a landlord draft</div></div></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STAGES.map((s) => (
                <label key={s} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
                  <input type="checkbox" checked={cadence.stages.includes(s)} onChange={(e) => setCadence({ stages: e.target.checked ? [...cadence.stages, s] : cadence.stages.filter((x) => x !== s) })} />{STAGE_LABEL[s]}
                </label>
              ))}
              <div><button className="btn btn-primary" disabled={save.busy} onClick={() => save.act({ key: "cadence", value: cadence }, "Cadence saved").catch(() => {})}>Save cadence</button></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Demo data</h2><div className="sub">Fictional London and Kent records</div></div></div>
            <div className="card-body" style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" disabled={reset.busy} onClick={() => { if (confirm("Replace all demo records with a fresh set?")) reset.act({}, "Demo data reset").catch(() => {}); }}>Reset demo data</button>
              <button className="btn btn-ghost" disabled={clear.busy} onClick={() => { if (confirm("Delete all demo records? Your own records are kept.")) clear.act({}, "Demo data cleared").catch(() => {}); }}>Clear demo data</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
