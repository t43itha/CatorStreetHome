import Link from "next/link";
import { Icon } from "@/components/Icons.tsx";
import { Shell } from "@/components/Shell.tsx";
import { OnboardingFlow } from "@/components/OnboardingFlow.tsx";

// Ported from the approved mockup. Demo content; real data arrives with Convex (plan Step 1.2).
export default function OnboardingPage() {
  return (
    <Shell active="clients">
      <div className="crumbs"><Link href="/clients/okafor">Clients</Link><span>/</span><span>Add client</span></div>
      <div className="page-head">
        <div><span className="eyebrow">Onboarding · saved as you go</span><h1 className="page">James Whitfield</h1><p className="lede">Started 12 Nov. Resume any time from Home or the Clients list. Landlord reminders are held until you activate.</p></div>
        <div style={{ display: "flex", gap: "8px" }}><button className="btn btn-ghost" disabled>Discard</button><button className="btn btn-ghost" disabled>Save and finish later</button></div>
      </div>
      <div className="ob">
        <OnboardingFlow
          properties={<>
            <div className="card" style={{ marginBottom: "16px" }}>
              <div className="card-head"><div><h2 className="card-title">41 Maidstone Road, Gillingham</h2><div className="sub">Property details</div></div><span className="tag green">Saved</span></div>
              <div className="fgrid">
                <div className="fld wide"><label>Address</label><div className="in">41 Maidstone Road, Gillingham</div></div>
                <div className="fld"><label>Postcode</label><div className="in">ME7 1LP</div></div>
                <div className="fld"><label>Area (from postcode)</label><div className="in">Kent</div></div>
                <div className="fld"><label>Service tier</label><div className="in">Full Management (client default)</div></div>
                <div className="fld"><label>Gas supply</label><div className="seg3"><button className="on">Yes</button><button>No</button></div></div>
                <div className="fld"><label>Council licence</label><div className="in">None</div></div>
                <div className="fld wide"><label>OneDrive property folder</label><div className="in"><Icon name="onedrive" style={{ width: "14px", color: "#0F6CBD" }} />Clients/Whitfield/41 Maidstone Rd</div></div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: "16px" }}>
              <div className="card-head"><div><h2 className="card-title">Tenancy</h2><div className="sub">Is it let right now?</div></div><div className="seg3"><button className="on">Let</button><button>Vacant</button></div></div>
              <div className="fgrid">
                <div className="fld wide"><label>Tenants</label><div className="in">Daniel Osei · daniel.o@example.com</div></div>
                <div className="fld"><label>Type</label><div className="in">Assured periodic</div></div>
                <div className="fld"><label>Start date</label><div className="in">09/01/2025 <span className="tag" style={{ marginLeft: "auto" }}>before 2026 reform</span></div></div>
                <div className="fld"><label>Rent</label><div className="in">£1,425 per month</div></div>
                <div className="fld"><label>Deposit</label><div className="in">£1,644 · DPS · received 09/01/2025</div></div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div><h2 className="card-title">Compliance quick entry</h2><div className="sub">Only what applies to this property. Status updates as you type.</div></div></div>
              <div className="scroll-x"><table className="matrix qe">
                <thead><tr><th>Requirement</th><th>Have it?</th><th>Issued / done</th><th>Expires / follow-up</th><th>Status</th><th></th></tr></thead>
                <tbody><tr className="grp"><td colSpan={6}>Property · recurring</td></tr><tr><td><div className="dn">Gas Safety (CP12)</div><div className="dm">12-monthly · has gas</div></td><td><div className="seg3"><button className="on">Have it</button><button >Request</button><button >N/A</button></div></td><td className="num"><span className="in">02/10/2025</span></td><td className="num"><span className="in">02/10/2026</span></td><td><span className="pill overdue">Overdue</span></td><td><span className="tag">Urgent on Home</span></td></tr><tr><td><div className="dn">EICR</div><div className="dm">Outcome: Unsatisfactory</div></td><td><div className="seg3"><button className="on">Have it</button><button >Request</button><button >N/A</button></div></td><td className="num"><span className="in">20/10/2026</span></td><td className="num"><span className="in">20/10/2031</span></td><td><span className="pill urgent">Remedial due 17 Nov</span></td><td><span className="tag">+ remedial obligation</span></td></tr><tr><td><div className="dn">EPC</div><div className="dm">Rating D</div></td><td><div className="seg3"><button className="on">Have it</button><button >Request</button><button >N/A</button></div></td><td className="num"><span className="in">04/03/2022</span></td><td className="num"><span className="in">04/03/2032</span></td><td><span className="pill current">Current</span></td><td></td></tr><tr><td><div className="dn">Buildings insurance</div><div className="dm">Landlord policy</div></td><td><div className="seg3"><button >Have it</button><button className="on">Request</button><button >N/A</button></div></td><td className="num"><span style={{ color: "var(--ink-mute)" }}>—</span></td><td className="num"><span style={{ color: "var(--ink-mute)" }}>—</span></td><td><span className="pill missing">Requested</span></td><td></td></tr><tr><td><div className="dn">Smoke &amp; CO alarms</div><div className="dm">At tenancy start + annual</div></td><td><div className="seg3"><button className="on">Have it</button><button >Request</button><button >N/A</button></div></td><td className="num"><span className="in">11/01/2026</span></td><td className="num"><span className="in">11/01/2027</span></td><td><span className="pill early">53 days</span></td><td></td></tr><tr><td><div className="dn">Property licence</div><div className="dm">Medway: no scheme</div></td><td><div className="seg3"><button >Have it</button><button >Request</button><button className="on">N/A</button></div></td><td className="num"><span style={{ color: "var(--ink-mute)" }}>—</span></td><td className="num"><span style={{ color: "var(--ink-mute)" }}>—</span></td><td><span className="pill na">N/A</span></td><td><span className="tag">Not in a licensing area</span></td></tr><tr className="grp"><td colSpan={6}>Tenancy · started 9 Jan 2025 (before 1 May 2026)</td></tr><tr><td><div className="dn">Right to Rent</div><div className="dm">Time-limited · follow-up date required</div></td><td><div className="seg3"><button className="on">Have it</button><button >Request</button><button >N/A</button></div></td><td className="num"><span className="in">05/01/2025</span></td><td className="num"><span className="in">25/11/2026</span></td><td><span className="pill urgent">Follow-up 6 days</span></td><td></td></tr><tr><td><div className="dn">Deposit + prescribed info</div><div className="dm">Received 9 Jan 2025 · due +30 days</div></td><td><div className="seg3"><button className="on">Have it</button><button >Request</button><button >N/A</button></div></td><td className="num"><span className="in">03/02/2025</span></td><td className="num"><span className="in ph">—</span></td><td><span className="pill current">Done</span></td><td></td></tr><tr><td><div className="dn">Information sheet (2026 reform)</div><div className="dm">Was due 31 May 2026</div></td><td><div className="seg3"><button >Have it</button><button className="on">Request</button><button >N/A</button></div></td><td className="num"><span style={{ color: "var(--ink-mute)" }}>—</span></td><td className="num"><span style={{ color: "var(--ink-mute)" }}>—</span></td><td><span className="pill missing">Requested</span></td><td></td></tr><tr><td><div className="dn">Inventory &amp; check-in</div><div className="dm">Tenancy start</div></td><td><div className="seg3"><button className="on">Have it</button><button >Request</button><button >N/A</button></div></td><td className="num"><span className="in">09/01/2025</span></td><td className="num"><span className="in ph">—</span></td><td><span className="pill current">Done</span></td><td></td></tr></tbody>
              </table></div>
            </div>
          </>}
          review={<>
            <div className="card" style={{ marginBottom: "16px" }}>
              <div className="card-head"><div><h2 className="card-title">Needs action now</h2><div className="sub">Already on Home, labelled Onboarding</div></div><span className="pill overdue">3 urgent</span></div>
              <div className="rows">
                <div className="row"><div className="ico red"><Icon name="flame" /></div><div><div className="t">Gas certificate expired 2 Oct</div><div className="s">41 Maidstone Road · let property</div></div><span className="tag">Book engineer</span><div></div></div>
                <div className="row"><div className="ico orange"><Icon name="bolt" /></div><div><div className="t">EICR remedial work due 17 Nov</div><div className="s">41 Maidstone Road · unsatisfactory report</div></div><span className="tag">Remedial</span><div></div></div>
                <div className="row"><div className="ico orange"><Icon name="id" /></div><div><div className="t">Right to Rent follow-up 25 Nov</div><div className="s">Daniel Osei · time-limited right</div></div><span className="tag">Tenant</span><div></div></div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: "16px" }}>
              <div className="card-head"><div><h2 className="card-title">Request from James</h2><div className="sub">One email instead of separate reminders</div></div><span className="tag">4 items</span></div>
              <ul className="reqlist">
                <li><Icon name="file" />Proof of address</li>
                <li><Icon name="file" />NRL1 approval letter</li>
                <li><Icon name="file" />Buildings insurance policy · 41 Maidstone Road</li>
                <li><Icon name="file" />Information sheet confirmation · 41 Maidstone Road</li>
              </ul>
              <div className="note">Activating creates <b>one Outlook draft</b> ("Documents we need to complete your onboarding") and <b>one Action</b> waiting on James, due in 7 days. Normal reminders start from the next morning scan.</div>
            </div>
          </>}
        />

        <div className="card">
          <div className="card-head"><div><h2 className="card-title">This onboarding</h2><div className="sub">Live from the records</div></div></div>
          <div className="sumrow"><span>Properties</span><b>2</b></div>
          <div className="sumrow"><span>Obligations created</span><b>27</b></div>
          <div className="sumrow"><span><span className="pill current">Done</span></span><b>14</b></div>
          <div className="sumrow"><span><span className="pill overdue">Overdue or urgent</span></span><b>3</b></div>
          <div className="sumrow"><span><span className="pill missing">Requested</span></span><b>4</b></div>
          <div className="sumrow"><span><span className="pill missing">Still to enter</span></span><b>6</b></div>
          <div className="note">Urgent items appear on Home straight away. Landlord reminder drafts wait until you activate, so James gets one request, not a flood.</div>
        </div>
      </div>

    </Shell>
  );
}
