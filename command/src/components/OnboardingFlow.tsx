"use client";

import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAct } from "./Act.tsx";
import { Icon } from "./Icons.tsx";
import { MarkNotApplicable, RecordEvidence } from "./forms.tsx";
import { status, STATUS_LABEL } from "@/lib/status.ts";

type Step = "documents" | "properties" | "review";
type Ob = { id: string; templateCode?: string; label: string; tenancy?: boolean; dueDate?: string; satisfiedAt?: string; isNotApplicable: boolean; naReason?: string; disposition?: string };
export interface Progress {
  client: { _id: string; name: string; status: string; onboardingStartedAt?: string };
  clientDocs: Ob[];
  steps: ReadonlyArray<{ key: string; state: string }>;
  properties: Array<{ propertyId: string; address: string; status?: string; isLet: boolean; done: number; overdue: number; missing: number; requested: number; obligations: Ob[] }>;
  urgent: Array<{ obligationId: string; label: string; dueDate?: string; address?: string }>;
  requestList: Array<{ obligationId: string; label: string; propertyAddress?: string }>;
  totals: { obligations: number; done: number; requested: number; stillToEnter: number; urgent: number };
}

/** "Have it / Request / N/A" for one obligation, writing through the ordinary mutations. */
function Choice({ o, today }: { o: Ob; today: string }) {
  const request = useAct("obligations:setDisposition");
  const s = status(o, today);
  const pill = o.disposition === "request_from_landlord" && !o.satisfiedAt ? <span className="pill missing">Requested</span> : <span className={`pill ${s}`}>{o.isNotApplicable ? "N/A" : STATUS_LABEL[s]}</span>;
  return (
    <tr>
      <td><div className="dn">{o.label}</div><div className="dm">{o.isNotApplicable ? o.naReason : o.dueDate ? `Due ${o.dueDate.split("-").reverse().join("/")}` : o.satisfiedAt ? "Recorded" : ""}</div></td>
      <td>
        {!o.satisfiedAt && !o.isNotApplicable ? (
          <div className="row-acts" style={{ justifyContent: "flex-start" }}>
            <RecordEvidence obligationId={o.id} templateCode={o.templateCode ?? ""} label={o.label} text="Have it" />
            <button className="btn btn-ghost btn-sm" disabled={request.busy || o.disposition === "request_from_landlord"} onClick={() => request.act({ obligationId: o.id, disposition: "request_from_landlord" }, "Added to the request list").catch(() => {})}>Request</button>
            <MarkNotApplicable obligationId={o.id} />
          </div>
        ) : <span style={{ color: "var(--ink-mute)", fontSize: 12.5 }}>—</span>}
      </td>
      <td>{pill}</td>
    </tr>
  );
}

const dupRef = makeFunctionReference<"query", { postcode: string; addressLine1: string }, Array<{ propertyId: string; clientName: string; address: string; clientId: string }>>("properties:findPossibleDuplicates");

function AddProperty({ clientId }: { clientId: string }) {
  const [f, setF] = useState({ addressLine1: "", postcode: "", hasGas: true, licenceType: "none", let: true, tenants: "", startDate: "", rentGbp: "", depositAmountGbp: "", depositReceivedDate: "", depositScheme: "DPS" });
  const add = useAct("properties:add");
  const start = useAct("tenancies:start");
  const dups = useQuery(dupRef, f.postcode.length >= 3 && f.addressLine1.length >= 4 ? { postcode: f.postcode, addressLine1: f.addressLine1 } : "skip");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const propertyId = await add.act({ clientId, addressLine1: f.addressLine1, postcode: f.postcode, hasGas: f.hasGas, licenceType: f.licenceType }).catch(() => null);
    if (!propertyId) return;
    if (f.let && f.startDate) {
      const args: Record<string, unknown> = { propertyId, startDate: f.startDate, tenants: f.tenants.split(/\s*(?:&|,| and )\s*/).filter(Boolean).map((name) => ({ name })) };
      if (f.rentGbp) args.rentGbp = Number(f.rentGbp);
      if (f.depositAmountGbp) args.depositAmountGbp = Number(f.depositAmountGbp);
      if (f.depositReceivedDate) args.depositReceivedDate = f.depositReceivedDate;
      if (f.depositScheme) args.depositScheme = f.depositScheme;
      await start.act(args, "Property and tenancy saved").catch(() => {});
    }
    setF({ ...f, addressLine1: "", postcode: "", tenants: "", startDate: "", rentGbp: "", depositAmountGbp: "", depositReceivedDate: "" });
  }
  return (
    <form className="card" style={{ marginBottom: 16 }} onSubmit={submit}>
      <div className="card-head"><div><h2 className="card-title">Add a property</h2><div className="sub">Compliance items appear for what applies. Status updates as you enter dates.</div></div></div>
      <div className="fgrid">
        <div className="form-row fld wide"><label>Address<input required value={f.addressLine1} onChange={set("addressLine1")} /></label></div>
        <div className="form-row fld"><label>Postcode<input required value={f.postcode} onChange={set("postcode")} /></label></div>
        <div className="form-row fld"><label>Gas supply<select value={f.hasGas ? "yes" : "no"} onChange={(e) => setF({ ...f, hasGas: e.target.value === "yes" })}><option value="yes">Yes</option><option value="no">No</option></select></label></div>
        <div className="form-row fld"><label>Council licence<select value={f.licenceType} onChange={set("licenceType")}><option value="none">None</option><option value="selective">Selective</option><option value="additional">Additional</option><option value="hmo">HMO</option></select></label></div>
        <div className="form-row fld"><label>Let right now?<select value={f.let ? "yes" : "no"} onChange={(e) => setF({ ...f, let: e.target.value === "yes" })}><option value="yes">Let</option><option value="no">Vacant</option></select></label></div>
        {f.let && <>
          <div className="form-row fld wide"><label>Tenants<input value={f.tenants} onChange={set("tenants")} placeholder="e.g. Ayesha & Tom Reid" /></label></div>
          <div className="form-row fld"><label>Tenancy start (assured periodic)<input type="date" required value={f.startDate} onChange={set("startDate")} /></label></div>
          <div className="form-row fld"><label>Rent (£ per month)<input inputMode="numeric" value={f.rentGbp} onChange={set("rentGbp")} /></label></div>
          <div className="form-row fld"><label>Deposit (£)<input inputMode="numeric" value={f.depositAmountGbp} onChange={set("depositAmountGbp")} /></label></div>
          <div className="form-row fld"><label>Deposit received<input type="date" value={f.depositReceivedDate} onChange={set("depositReceivedDate")} /></label></div>
        </>}
      </div>
      {dups && dups.length > 0 && <div className="note" style={{ color: "var(--overdue)" }}>Possible duplicate: {dups.map((d) => <Link key={d.propertyId} href={`/properties/${d.propertyId}`} style={{ textDecoration: "underline" }}>{d.address} ({d.clientName})</Link>)}</div>}
      <div className="note" style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn btn-primary" disabled={add.busy || start.busy}><Icon name="plus" />Save property</button></div>
    </form>
  );
}

export function OnboardingFlow({ p, today }: { p: Progress; today: string }) {
  const first = (p.steps.find((s) => s.key !== "landlord" && s.state !== "done")?.key ?? "review") as Step;
  const [step, setStep] = useState<Step>(first);
  const activate = useAct("onboarding:activate");
  const discard = useAct("onboarding:discard");
  const router = useRouter();
  const state = (k: string) => p.steps.find((s) => s.key === k)?.state;
  const StepBtn = ({ k, n, title, sub, children }: { k: Step; n: number; title: string; sub: string; children?: React.ReactNode }) => (
    <button className={`step${state(k) === "done" ? " done" : ""}${step === k ? " on" : ""}`} onClick={() => setStep(k)}>
      <span className="n">{state(k) === "done" ? "✓" : n}</span><div><div className="t">{title}</div><div className="s">{sub}</div>{children}</div>
    </button>
  );

  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">Onboarding · saved as you go</span><h1 className="page">{p.client.name}</h1>
          <p className="lede">{p.client.onboardingStartedAt ? `Started ${p.client.onboardingStartedAt.split("-").reverse().join("/")}. ` : ""}Resume any time from Home or the Clients list. Landlord reminders are held until you activate.</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          {p.client.status === "onboarding" && <button className="btn btn-ghost" disabled={discard.busy} onClick={() => { if (window.confirm(`Discard ${p.client.name} and everything entered for them?`)) discard.act({ clientId: p.client._id }, "Discarded").then(() => router.push("/clients")).catch(() => {}); }}>Discard</button>}
          <Link className="btn btn-ghost" href="/">Save and finish later</Link>
        </div>
      </div>
      <div className="ob">
        <div className="card steps">
          <button className="step done"><span className="n">✓</span><div><div className="t">Landlord</div><div className="s">Saved</div></div></button>
          <StepBtn k="documents" n={2} title="Landlord documents" sub={`${p.clientDocs.filter((d) => d.satisfiedAt).length} recorded · ${p.clientDocs.filter((d) => d.disposition === "request_from_landlord" && !d.satisfiedAt).length} requested`} />
          <StepBtn k="properties" n={3} title="Properties" sub={`${p.properties.length} propert${p.properties.length === 1 ? "y" : "ies"}`}>
            <div className="sub">{p.properties.map((x) => <span key={x.propertyId}>{x.missing === 0 ? "✓" : "●"} {x.address}</span>)}</div>
          </StepBtn>
          <StepBtn k="review" n={4} title="Review & activate" sub={`${p.requestList.length ? "1 email · 1 action" : "No requests"}`} />
        </div>

        <div>
          {step === "documents" && (
            <div className="card">
              <div className="card-head"><div><h2 className="card-title">Landlord documents</h2><div className="sub">Have it, request it, or mark it not applicable</div></div></div>
              <div className="scroll-x"><table className="matrix qe"><tbody>{p.clientDocs.map((o) => <Choice key={o.id} o={o} today={today} />)}</tbody></table></div>
              <div className="obfoot" style={{ padding: "0 20px 18px" }}><span /><button className="btn btn-primary" onClick={() => setStep("properties")}>Continue to properties<Icon name="arrow" /></button></div>
            </div>
          )}
          {step === "properties" && (
            <>
              <AddProperty clientId={p.client._id} />
              {p.properties.map((x) => (
                <div className="card" style={{ marginBottom: 16 }} key={x.propertyId}>
                  <div className="card-head"><div><h2 className="card-title">{x.address}</h2><div className="sub">{x.isLet ? "Let" : "Vacant"} · {x.done} done · {x.overdue} urgent · {x.requested} requested · {x.missing} still to enter</div></div><Link className="btn-link" href={`/properties/${x.propertyId}`}>Open <Icon name="arrow" /></Link></div>
                  <div className="scroll-x"><table className="matrix qe">
                    <thead><tr><th>Requirement</th><th>Have it?</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr className="grp"><td colSpan={3}>Property</td></tr>
                      {x.obligations.filter((o) => !o.tenancy).map((o) => <Choice key={o.id} o={o} today={today} />)}
                      {x.obligations.some((o) => o.tenancy) && <tr className="grp"><td colSpan={3}>Tenancy</td></tr>}
                      {x.obligations.filter((o) => o.tenancy).map((o) => <Choice key={o.id} o={o} today={today} />)}
                    </tbody>
                  </table></div>
                </div>
              ))}
              <div className="obfoot"><span /><button className="btn btn-primary" onClick={() => setStep("review")}>Continue to review<Icon name="arrow" /></button></div>
            </>
          )}
          {step === "review" && (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-head"><div><h2 className="card-title">Needs action now</h2><div className="sub">Already on Home, labelled Onboarding</div></div><span className="pill overdue">{p.urgent.length} urgent</span></div>
                <div className="rows">
                  {p.urgent.length === 0 && <div className="empty">Nothing urgent.</div>}
                  {p.urgent.map((u) => <div className="row" key={u.obligationId}><div className="ico red"><Icon name="alert" /></div><div><div className="t">{u.label}</div><div className="s">{u.address ?? p.client.name}{u.dueDate ? ` · due ${u.dueDate.split("-").reverse().join("/")}` : " · no date recorded"}</div></div><span /><div /></div>)}
                </div>
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-head"><div><h2 className="card-title">Request from {p.client.name.split(" ")[0]}</h2><div className="sub">One email instead of separate reminders</div></div><span className="tag">{p.requestList.length} items</span></div>
                <ul className="reqlist">{p.requestList.length === 0 ? <li style={{ color: "var(--ink-mute)" }}>Nothing requested.</li> : p.requestList.map((r) => <li key={r.obligationId}><Icon name="file" />{r.label}{r.propertyAddress ? ` · ${r.propertyAddress}` : ""}</li>)}</ul>
                <div className="note">Activating creates <b>one email draft</b> (&quot;Documents we need to complete your onboarding&quot;) and <b>one Action</b> waiting on the landlord, due in 7 days. Normal reminders start from the next compliance check.</div>
              </div>
              <div className="obfoot">
                <button className="btn btn-ghost" onClick={() => setStep("properties")}>Back to properties</button>
                <button className="btn btn-primary" disabled={activate.busy || p.client.status !== "onboarding"} onClick={() => activate.act({ clientId: p.client._id, draftRequestEmail: true }, `${p.client.name} is active`).then(() => router.push(`/clients/${p.client._id}`)).catch(() => {})}>{p.client.status === "onboarding" ? "Activate client" : "Active"}</button>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-head"><div><h2 className="card-title">This onboarding</h2><div className="sub">Live from the records</div></div></div>
          <div className="sumrow"><span>Properties</span><b>{p.properties.length}</b></div>
          <div className="sumrow"><span>Obligations created</span><b>{p.totals.obligations}</b></div>
          <div className="sumrow"><span><span className="pill current">Done</span></span><b>{p.totals.done}</b></div>
          <div className="sumrow"><span><span className="pill overdue">Overdue or urgent</span></span><b>{p.totals.urgent}</b></div>
          <div className="sumrow"><span><span className="pill missing">Requested</span></span><b>{p.totals.requested}</b></div>
          <div className="sumrow"><span><span className="pill missing">Still to enter</span></span><b>{p.totals.stillToEnter}</b></div>
          <div className="note">Urgent items appear on Home straight away. Landlord reminder drafts wait until you activate, so the landlord gets one request, not a flood.</div>
        </div>
      </div>
    </>
  );
}
