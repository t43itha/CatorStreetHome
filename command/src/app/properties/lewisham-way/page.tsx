import Link from "next/link";
import { Icon } from "@/components/Icons.tsx";
import { Shell } from "@/components/Shell.tsx";
import { ComplianceRows, ComplianceScore } from "@/components/ComplianceMatrix.tsx";
import { buildDemo, LEWISHAM } from "@/lib/demo.ts";
import { todayLondon } from "@/lib/status.ts";
import { connection } from "next/server";

// Ported from the approved mockup. Demo content; real data arrives with Convex (plan Step 1.2).
export default async function PropertyPage() {
  await connection();
  const today = todayLondon();
  const rows = buildDemo(today).compliance.filter((o) => o.where === LEWISHAM && o.matrix);
  return (
    <Shell active="properties">
      <div className="crumbs"><Link href="/clients/okafor">Clients</Link><span>/</span><Link href="/clients/okafor">Margaret Okafor</Link><span>/</span><span>Flat 3, 22 Lewisham Way</span></div>
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="entity" style={{ marginBottom: "0" }}>
          <div className="l">
            <div className="thumb" style={{ width: "84px", height: "64px", borderRadius: "10px" }}></div>
            <div>
              <h1>Flat 3, 22 Lewisham Way</h1>
              <div className="contact" style={{ marginTop: "6px" }}><span><Icon name="pin" />London SE14 6NP · Lewisham</span><span><Icon name="users" />Landlord: <Link href="/clients/okafor" style={{ color: "var(--green)", fontWeight: "600", marginLeft: "3px" }}>Margaret Okafor</Link></span></div>
              <div className="tags"><span className="tag navy">Full Management</span><span className="pill current">Let</span><span className="tag">Gas supply</span><span className="tag">No licence required</span></div>
            </div>
          </div>
          <div className="r">
            <button className="btn btn-ghost od" disabled><Icon name="onedrive" />Property folder<Icon name="ext" style={{ width: "13px", color: "var(--ink-mute)" }} /></button>
            <button className="btn btn-primary" disabled><Icon name="plus" />Add action</button>
          </div>
        </div>
      </div>

      <div className="two" style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}>
        <div className="card">
          <div className="card-head">
            <div><h2 className="card-title">Compliance</h2><div className="sub">Statutory dates vs. CSPS reminder targets</div></div>
            <ComplianceScore rows={rows} today={today} />
          </div>
          <div className="scroll-x"><table className="matrix">
            <thead><tr><th>Document</th><th>Status</th><th>Expires</th><th>Remind by</th><th>File</th><th>Owner</th><th></th></tr></thead>
            <ComplianceRows rows={rows} today={today} />
          </table></div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Tenancy</h2><div className="sub">Current let</div></div></div>
            <div className="ten">
              <div><div className="k">Tenant</div><div className="v">Ayesha &amp; Tom Reid</div></div>
              <div><div className="k">Rent</div><div className="v">£1,650 pcm</div></div>
              <div><div className="k">Start</div><div className="v">14 Jun 2026</div></div>
              <div><div className="k">Type</div><div className="v">Assured periodic</div></div>
              <div><div className="k">Notice given</div><div className="v">None</div></div>
              <div><div className="k">Deposit</div><div className="v">£1,903 · DPS</div></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Open actions</h2></div><button className="btn-link" disabled><Icon name="plus" />Add</button></div>
            <div className="rows">
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><div><div className="t">Book EICR — 3 quotes</div><div className="s">You → Sparks &amp; Co · due 21 Nov</div></div><span className="pill urgent">2d</span></div>
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><div><div className="t">Upload inventory to OneDrive</div><div className="s">You · from compliance gap</div></div><span className="pill missing">Open</span></div>
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><div><div className="t">Extractor fan approval</div><div className="s">Waiting on Margaret</div></div><span className="pill early">Waiting</span></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Recent</h2></div></div>
            <div className="timeline">
              <div className="tl"><div className="b"><Icon name="mail" /></div><div><div className="t">EICR reminder drafted (7-day)</div><div className="s">Today · Outlook Drafts</div></div></div>
              <div className="tl"><div className="b"><Icon name="mail" /></div><div><div className="t">EICR reminder sent (30-day)</div><div className="s">26 Oct · to Margaret</div></div></div>
              <div className="tl"><div className="b"><Icon name="check" /></div><div><div className="t">Gas Safety renewed</div><div className="s">9 Aug · Southern Gas Ltd</div></div></div>
            </div>
          </div>
        </div>
      </div>

    </Shell>
  );
}
