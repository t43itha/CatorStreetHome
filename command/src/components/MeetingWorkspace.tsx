"use client";

import { useState } from "react";
import { useAct } from "./Act.tsx";
import { Icon } from "./Icons.tsx";

export function MeetingWorkspace({ id, notes, decisions, actions }: {
  id: string; notes: string; decisions: string[];
  actions: Array<{ _id: string; title: string; ownerType: string; waitingOn?: string; dueDate?: string; status: string }>;
}) {
  const [text, setText] = useState(notes);
  const [action, setAction] = useState({ title: "", ownerType: "you", waitingOn: "", dueDate: "" });
  const [decision, setDecision] = useState("");
  const save = useAct("meetings:saveNotes");
  const add = useAct("meetings:addAction");
  const decide = useAct("meetings:addDecision");
  return (
    <div className="two" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
      <div className="card">
        <div className="card-head"><div><h2 className="card-title">Notes</h2><div className="sub">Paste notes from Teams</div></div>
          <button className="btn btn-ghost btn-sm" disabled={save.busy || text === notes} onClick={() => save.act({ id, notes: text }, "Notes saved").catch(() => {})}>Save notes</button></div>
        <div className="card-body"><textarea className="notes" style={{ width: "100%", resize: "vertical" }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or type the meeting notes…" /></div>
      </div>
      <div className="stack">
        <div className="card">
          <div className="card-head"><div><h2 className="card-title">Action items</h2><div className="sub">Each one becomes a tracked action</div></div><span className="pill current">{actions.length} tracked</span></div>
          {actions.map((a) => (
            <div className="action" key={a._id}>
              <span className="check" style={a.status === "done" ? undefined : { background: "var(--card)", color: "var(--green)" }}><Icon name="check" /></span>
              <div><div className="t">{a.title}</div><div className="fields">
                <span className="field">Owner <b>{a.ownerType === "you" ? "You" : a.waitingOn ?? a.ownerType}</b></span>
                {a.dueDate && <span className="field">Due <b>{a.dueDate.split("-").reverse().join("/")}</b></span>}
                <span className="field">Status <b>{a.status}</b></span>
              </div></div>
            </div>
          ))}
          <form className="action" onSubmit={(e) => { e.preventDefault(); const args: Record<string, unknown> = { id, title: action.title, ownerType: action.ownerType }; if (action.dueDate) args.dueDate = action.dueDate; if (action.waitingOn) args.waitingOn = action.waitingOn; add.act(args, "Action tracked").then(() => setAction({ title: "", ownerType: "you", waitingOn: "", dueDate: "" })).catch(() => {}); }}>
            <span />
            <div className="form-row" style={{ gap: 8 }}>
              <input required placeholder="New action from this meeting" value={action.title} onChange={(e) => setAction({ ...action, title: e.target.value })} />
              <div className="form-grid">
                <select value={action.ownerType} onChange={(e) => setAction({ ...action, ownerType: e.target.value })}><option value="you">You</option><option value="landlord">Landlord</option><option value="tenant">Tenant</option><option value="contractor">Contractor</option></select>
                <input type="date" value={action.dueDate} onChange={(e) => setAction({ ...action, dueDate: e.target.value })} />
              </div>
              {action.ownerType !== "you" && <input placeholder="Waiting on (name)" value={action.waitingOn} onChange={(e) => setAction({ ...action, waitingOn: e.target.value })} />}
              <div><button className="btn btn-ghost btn-sm" disabled={add.busy}><Icon name="plus" />Add action</button></div>
            </div>
          </form>
        </div>
        <div className="card">
          <div className="card-head"><div><h2 className="card-title">Decisions</h2><div className="sub">Saved to the client&apos;s timeline</div></div></div>
          {decisions.map((d, i) => <div className="decision" key={i}><Icon name="check" /><span>{d}</span></div>)}
          <form className="decision" style={{ paddingBottom: 16 }} onSubmit={(e) => { e.preventDefault(); decide.act({ id, decision }, "Decision saved").then(() => setDecision("")).catch(() => {}); }}>
            <div className="form-row" style={{ flex: 1, flexDirection: "row", gap: 8 }}><input style={{ flex: 1 }} required placeholder="Record a decision" value={decision} onChange={(e) => setDecision(e.target.value)} /><button className="btn btn-ghost btn-sm" disabled={decide.busy}>Add</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
