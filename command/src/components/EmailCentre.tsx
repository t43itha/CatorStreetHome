"use client";

import { useState } from "react";
import { useAct } from "./Act.tsx";
import { useToast } from "./ConvexClientProvider.tsx";
import { Icon } from "./Icons.tsx";

export interface DraftView { _id: string; stage: string; to: string; toEmail?: string; subject: string; body?: string; createdAt: number; dueDate?: string }
export interface SentView { _id: string; to: string; subject: string; sentAt?: number }
export interface ThreadView { _id: string; subject: string; snippet: string; status: string; occurredAt: string }

const STAGE: Record<string, { label: string; cls: string }> = {
  "30d": { label: "30-day", cls: "soon" }, "14d": { label: "14-day", cls: "soon" }, "7d": { label: "7-day", cls: "urgent" },
  overdue: { label: "Overdue", cls: "overdue" }, missing: { label: "Missing", cls: "missing" }, onboarding_request: { label: "Onboarding", cls: "early" },
};
const time = (ms: number) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(ms);

/** Phase 1 human-in-the-loop queue: edit, copy or open in your mail app, then Mark sent. Nothing is sent automatically. */
export function EmailCentre({ drafts, sent, threads }: { drafts: DraftView[]; sent: SentView[]; threads: ThreadView[] }) {
  const [tab, setTab] = useState<"drafts" | "sent" | "threads">("drafts");
  const [selected, setSelected] = useState<string | undefined>(drafts[0]?._id);
  const d = drafts.find((x) => x._id === selected) ?? drafts[0];
  const [edit, setEdit] = useState<{ subject: string; body: string } | null>(null);
  const save = useAct("reminders:update");
  const markSent = useAct("reminders:markSent");
  const dismiss = useAct("reminders:dismiss");
  const turnInto = useAct("emails:turnIntoAction");
  const setStatus = useAct("emails:setStatus");
  const toast = useToast();
  const subject = edit?.subject ?? d?.subject ?? "";
  const body = edit?.body ?? d?.body ?? "";

  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">Email Centre</span><h1 className="page">Renewal drafts</h1><p className="lede">Reserved by the daily compliance check. Nothing is sent without you: copy or open each one, send it from Outlook, then mark it sent.</p></div>
        <div className="segs">
          <button className={`seg${tab === "drafts" ? " on" : ""}`} onClick={() => setTab("drafts")}>Drafts · {drafts.length}</button>
          <button className={`seg${tab === "sent" ? " on" : ""}`} onClick={() => setTab("sent")}>Sent log</button>
          <button className={`seg${tab === "threads" ? " on" : ""}`} onClick={() => setTab("threads")}>Logged threads · {threads.length}</button>
        </div>
      </div>

      {tab === "drafts" && (drafts.length === 0 ? <div className="card"><div className="empty">No drafts waiting. The next compliance check will add any that fall due.</div></div> : (
        <div className="card mail">
          <div className="mail-list">
            {drafts.map((x) => (
              <div key={x._id} className={`mail-item${x._id === d?._id ? " sel" : ""}`} role="button" tabIndex={0} onClick={() => { setSelected(x._id); setEdit(null); }} onKeyDown={(e) => { if (e.key === "Enter") { setSelected(x._id); setEdit(null); } }}>
                <div className="top-l"><span>{x.to.split(" · ")[0]}</span><span>{time(x.createdAt)}</span></div>
                <div className="t">{x.subject}</div>
                <div className="s">{(x.body ?? "").split("\n").find((l) => l && !l.startsWith("Dear")) ?? ""}</div>
                <div className="chips"><span className={`pill ${STAGE[x.stage]?.cls ?? "soon"}`}>{STAGE[x.stage]?.label ?? x.stage}</span><span className="tag">Ready</span></div>
              </div>
            ))}
          </div>
          {d && (
            <div className="mail-view">
              <div className="context-box">
                <Icon name="mail" style={{ color: "var(--urgent)" }} />
                <span>{d.to}{d.dueDate ? <> · due <b>{d.dueDate.split("-").reverse().join("/")}</b></> : null}</span>
                <span className="dedupe"><Icon name="shield" style={{ width: 13 }} />One draft per stage</span>
              </div>
              <div className="mail-meta">
                <span className="k">To</span><span>{d.to.split(" · ")[0]}{d.toEmail ? ` <${d.toEmail}>` : " (no email on file)"}</span>
                <span className="k">Subject</span>{edit ? <input className="in" style={{ font: "inherit", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 8px" }} value={subject} onChange={(e) => setEdit({ subject: e.target.value, body })} /> : <span>{subject}</span>}
              </div>
              {edit
                ? <textarea style={{ font: "inherit", fontSize: 14, lineHeight: 1.6, marginTop: 16, minHeight: 280, border: "1px solid var(--line)", borderRadius: 8, padding: 12 }} value={body} onChange={(e) => setEdit({ subject, body: e.target.value })} />
                : <><h2 className="mail-subject">{subject}</h2><div className="mail-body">{body.split("\n\n").map((p, i) => <p key={i} style={{ whiteSpace: "pre-line" }}>{p}</p>)}</div></>}
              <div className="mail-foot">
                <a className="btn btn-primary" href={`mailto:${d.toEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}><Icon name="ext" />Open in mail app</a>
                <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(`${subject}\n\n${body}`).then(() => toast("Copied"))}>Copy email</button>
                {edit
                  ? <button className="btn btn-ghost" disabled={save.busy} onClick={() => save.act({ id: d._id, subject, body }, "Draft saved").then(() => setEdit(null)).catch(() => {})}>Save edits</button>
                  : <button className="btn btn-ghost" onClick={() => setEdit({ subject, body })}>Edit here</button>}
                <button className="btn btn-ghost" disabled={markSent.busy} onClick={() => markSent.act({ id: d._id }, "Marked as sent · logged to the timeline").then(() => setSelected(undefined)).catch(() => {})}><Icon name="send" />Mark sent</button>
                <button className="btn btn-ghost" style={{ marginLeft: "auto", color: "var(--ink-mute)" }} disabled={dismiss.busy} onClick={() => dismiss.act({ id: d._id }, "Dismissed").then(() => setSelected(undefined)).catch(() => {})}>Dismiss</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {tab === "sent" && (
        <div className="card">
          {sent.length === 0 && <div className="empty">Nothing sent yet.</div>}
          {sent.map((x) => <div className="draft-mini" key={x._id}><Icon name="send" style={{ color: "var(--green)" }} /><div><div className="t">{x.subject}</div><div className="s">To {x.to}{x.sentAt ? ` · ${time(x.sentAt)}` : ""}</div></div></div>)}
        </div>
      )}

      {tab === "threads" && (
        <div className="card">
          {threads.length === 0 && <div className="empty">No logged threads.</div>}
          {threads.map((t) => (
            <div className="row" key={t._id}>
              <div className="ico amber"><Icon name="mail" /></div>
              <div><div className="t">{t.subject}</div><div className="s">{t.snippet} · {t.status.replace("_", " ")}</div></div>
              <div className="acts" style={{ opacity: 1 }}>
                <button className="btn btn-ghost btn-sm" disabled={turnInto.busy} onClick={() => turnInto.act({ id: t._id }, "Action created").catch(() => {})}>Turn into action</button>
                <button className="btn btn-ghost btn-sm" disabled={setStatus.busy} onClick={() => setStatus.act({ id: t._id, status: "resolved" }, "Resolved").catch(() => {})}>Resolve</button>
              </div>
              <div className="when mute">{t.occurredAt.split("-").reverse().slice(0, 2).join("/")}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
