"use client";

import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAct } from "./Act.tsx";

const TIERS = ["Full Management", "Full Management + Rent Protection", "Rent Collection", "Tenant-Find", "Property Sourcing"];
const dupRef = makeFunctionReference<"query", { email?: string; phone?: string; name: string }, Array<{ clientId: string; name: string; matchedOn: string }>>("clients:findPossibleDuplicates");

/** Onboarding step 1: the landlord. Saves on Continue and opens the rest of the flow. */
export function NewClientForm() {
  const [f, setF] = useState({ name: "", clientType: "individual", email: "", phone: "", preferredChannel: "Email", serviceTier: TIERS[0], isOverseas: false, repairLimitGbp: "", oneDriveFolderUrl: "" });
  const { act, busy } = useAct("clients:create");
  const router = useRouter();
  const dups = useQuery(dupRef, f.name.trim().length >= 3 ? { name: f.name, ...(f.email ? { email: f.email } : {}), ...(f.phone ? { phone: f.phone } : {}) } : "skip");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="card" onSubmit={(e) => {
      e.preventDefault();
      const args: Record<string, unknown> = { name: f.name, clientType: f.clientType, serviceTier: f.serviceTier, isOverseas: f.isOverseas, preferredChannel: f.preferredChannel };
      for (const k of ["email", "phone", "oneDriveFolderUrl"] as const) if (f[k]) args[k] = f[k];
      if (f.repairLimitGbp) args.repairLimitGbp = Number(f.repairLimitGbp);
      act(args, "Landlord saved").then((id) => router.push(`/clients/${id}/onboarding`)).catch(() => {});
    }}>
      <div className="card-head"><div><h2 className="card-title">Landlord</h2><div className="sub">Step 1 of 4 · saved when you continue</div></div></div>
      <div className="fgrid">
        <div className="form-row fld wide"><label>Name<input required value={f.name} onChange={set("name")} /></label></div>
        <div className="form-row fld"><label>Type<select value={f.clientType} onChange={set("clientType")}><option value="individual">Individual</option><option value="company">Company</option></select></label></div>
        <div className="form-row fld"><label>Email<input type="email" value={f.email} onChange={set("email")} /></label></div>
        <div className="form-row fld"><label>Phone / WhatsApp<input value={f.phone} onChange={set("phone")} /></label></div>
        <div className="form-row fld"><label>Preferred channel<select value={f.preferredChannel} onChange={set("preferredChannel")}><option>Email</option><option>Phone</option><option>WhatsApp</option></select></label></div>
        <div className="form-row fld"><label>Service tier<select value={f.serviceTier} onChange={set("serviceTier")}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select></label></div>
        <div className="form-row fld"><label>Overseas landlord<select value={f.isOverseas ? "yes" : "no"} onChange={(e) => setF({ ...f, isOverseas: e.target.value === "yes" })}><option value="no">No</option><option value="yes">Yes (NRL1 required)</option></select></label></div>
        <div className="form-row fld"><label>Repair approval limit (£)<input inputMode="numeric" value={f.repairLimitGbp} onChange={set("repairLimitGbp")} /></label></div>
        <div className="form-row fld wide"><label>OneDrive client folder link<input value={f.oneDriveFolderUrl} onChange={set("oneDriveFolderUrl")} /></label></div>
      </div>
      {dups && dups.length > 0 && (
        <div className="note" style={{ color: "var(--overdue)" }}>
          Possible existing client: {dups.map((d) => <span key={d.clientId}><Link href={`/clients/${d.clientId}`} style={{ textDecoration: "underline" }}>Open {d.name}</Link> (same {d.matchedOn}) </span>)}
        </div>
      )}
      <div className="note" style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn btn-primary" disabled={busy}>Continue</button></div>
    </form>
  );
}
