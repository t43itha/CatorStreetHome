"use client";

import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAct } from "./Act.tsx";
import { Dialog } from "./Dialog.tsx";
import { Icon } from "./Icons.tsx";

const RENEWALS = new Set(["gas", "eicr", "epc", "licence", "insurance", "alarms", "aml"]);

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="form-row"><label>{label}{children}</label></div>;
}

/** Record Evidence (plan §5.1): asks only for what drives the next obligation. */
export function RecordEvidence({ obligationId, templateCode, label, className = "btn btn-ghost btn-sm", text = "Record evidence" }: {
  obligationId: string; templateCode: string; label: string; className?: string; text?: string;
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const { act, busy } = useAct("obligations:recordEvidence");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const renewal = RENEWALS.has(templateCode);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const args: Record<string, unknown> = { obligationId };
    for (const [k, v] of Object.entries(f)) if (v) args[k] = v;
    await act(args, `${label} recorded`).then(() => { setOpen(false); setF({}); }).catch(() => {});
  }
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>{text}</button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Record evidence · ${label}`}>
        <form onSubmit={submit} style={{ display: "contents" }}>
          <div className="form-grid">
            <Row label={renewal ? "Issue date" : "Date done"}><input type="date" required value={f.issueDate ?? ""} onChange={set("issueDate")} /></Row>
            {renewal && <Row label="Expiry date"><input type="date" required value={f.expiryDate ?? ""} onChange={set("expiryDate")} /></Row>}
          </div>
          {templateCode === "eicr" && (
            <div className="form-grid">
              <Row label="Outcome"><select required value={f.outcome ?? ""} onChange={set("outcome")}><option value="">Choose…</option><option value="satisfactory">Satisfactory</option><option value="unsatisfactory">Unsatisfactory</option></select></Row>
              {f.outcome === "unsatisfactory" && <Row label="Report's remedial deadline (if sooner than 28 days)"><input type="date" value={f.reportRemedialDate ?? ""} onChange={set("reportRemedialDate")} /></Row>}
            </div>
          )}
          {templateCode === "rtr" && (
            <div className="form-grid">
              <Row label="Right to rent"><select required value={f.rightType ?? ""} onChange={set("rightType")}><option value="">Choose…</option><option value="unlimited">Unlimited</option><option value="time_limited">Time-limited</option></select></Row>
              {f.rightType === "time_limited" && <Row label="Follow-up date (required)"><input type="date" required value={f.followUpDate ?? ""} onChange={set("followUpDate")} /></Row>}
            </div>
          )}
          <Row label="OneDrive file name or link"><input value={f.oneDriveFileName ?? ""} onChange={set("oneDriveFileName")} placeholder="e.g. CP12_2027.pdf" /></Row>
          <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Save</button></div>
        </form>
      </Dialog>
    </>
  );
}

export function CorrectDate({ obligationId, dueDate }: { obligationId: string; dueDate?: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(dueDate ?? "");
  const { act, busy } = useAct("obligations:correctDate");
  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>{dueDate ? "Date" : "Add date"}</button>
      <Dialog open={open} onClose={() => setOpen(false)} title={dueDate ? "Correct the due date" : "Add the due date"}>
        <form style={{ display: "contents" }} onSubmit={(e) => { e.preventDefault(); act({ obligationId, dueDate: value }, "Date saved").then(() => setOpen(false)).catch(() => {}); }}>
          <p className="lede" style={{ fontSize: 13 }}>Edits this item in place. Reminders already sent for it are not repeated.</p>
          <Row label="Due date"><input type="date" required value={value} onChange={(e) => setValue(e.target.value)} /></Row>
          <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Save</button></div>
        </form>
      </Dialog>
    </>
  );
}

export function MarkNotApplicable({ obligationId }: { obligationId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { act, busy } = useAct("obligations:markNotApplicable");
  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>N/A</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Mark not applicable">
        <form style={{ display: "contents" }} onSubmit={(e) => { e.preventDefault(); act({ obligationId, reason }, "Marked N/A").then(() => setOpen(false)).catch(() => {}); }}>
          <Row label="Reason (required)"><input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. No gas supply" /></Row>
          <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Save</button></div>
        </form>
      </Dialog>
    </>
  );
}

/** Quick Capture → Action. Also used for "New action" and "Add action". */
export function NewAction({ className = "btn btn-primary", text = "New action", clientId, propertyId }: { className?: string; text?: React.ReactNode; clientId?: string; propertyId?: string }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", ownerType: "you", waitingOn: "", dueDate: "", details: "" });
  const { act, busy } = useAct("commitments:create");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>{text}</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New action">
        <form style={{ display: "contents" }} onSubmit={(e) => {
          e.preventDefault();
          const args: Record<string, unknown> = { title: f.title, ownerType: f.ownerType };
          if (f.dueDate) args.dueDate = f.dueDate;
          if (f.details) args.details = f.details;
          if (f.waitingOn) args.waitingOn = f.waitingOn;
          if (clientId) args.clientId = clientId;
          if (propertyId) args.propertyId = propertyId;
          act(args, "Action added").then(() => { setOpen(false); setF({ title: "", ownerType: "you", waitingOn: "", dueDate: "", details: "" }); }).catch(() => {});
        }}>
          <Row label="What was promised"><input required value={f.title} onChange={set("title")} /></Row>
          <div className="form-grid">
            <Row label="Next move is with"><select value={f.ownerType} onChange={set("ownerType")}><option value="you">You (CSPS)</option><option value="landlord">Landlord</option><option value="tenant">Tenant</option><option value="contractor">Contractor</option></select></Row>
            <Row label="Due"><input type="date" value={f.dueDate} onChange={set("dueDate")} /></Row>
          </div>
          {f.ownerType !== "you" && <Row label="Waiting on (name)"><input value={f.waitingOn} onChange={set("waitingOn")} /></Row>}
          <Row label="Context"><input value={f.details} onChange={set("details")} placeholder="Property, client or where it came from" /></Row>
          <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Add action</button></div>
        </form>
      </Dialog>
    </>
  );
}

type Hit = { kind: string; label: string; sub: string; href: string };
const searchRef = makeFunctionReference<"query", { q: string }, Hit[]>("views:search");

/** ⌘K search across landlords, addresses, tenants, compliance, actions, meetings and emails. */
export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const hits = useQuery(searchRef, open && q.trim().length >= 2 ? { q } : "skip");
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <button className="search" onClick={() => setOpen(true)} aria-label="Search">
        <Icon name="search" />Search landlords, postcodes, certificates, actions…<kbd>⌘K</kbd>
      </button>
      <Dialog open={open} onClose={() => { setOpen(false); setQ(""); }} title="Search">
        <div className="form-row"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, address, postcode, tenant, certificate…"
          onKeyDown={(e) => { if (e.key === "Enter" && hits?.[0]) { setOpen(false); router.push(hits[0].href); } }} /></div>
        <div className="palette-list">
          {q.trim().length >= 2 && hits?.length === 0 && <div className="empty">No matches</div>}
          {hits?.map((h, i) => (
            <Link key={i} className="palette-item" href={h.href} onClick={() => setOpen(false)}>
              <span className="k">{h.kind}</span><span><b>{h.label}</b><br /><small style={{ color: "var(--ink-mute)" }}>{h.sub}</small></span>
            </Link>
          ))}
        </div>
      </Dialog>
    </>
  );
}
