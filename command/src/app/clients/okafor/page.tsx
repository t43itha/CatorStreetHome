import Link from "next/link";
import { Icon } from "@/components/Icons.tsx";
import { Shell } from "@/components/Shell.tsx";

// Ported from the approved mockup. Demo content; real data arrives with Convex (plan Step 1.2).
export default function ClientPage() {
  return (
    <Shell active="clients">
      <div className="crumbs"><a>Clients</a><span>/</span><span>Margaret Okafor</span><Link className="btn-link" style={{ marginLeft: "auto" }} href="/clients/new"><Icon name="plus" />Add client</Link></div>
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="entity" style={{ marginBottom: "0" }}>
          <div className="l">
            <div className="big-av">MO</div>
            <div>
              <h1>Margaret Okafor</h1>
              <div className="tags"><span className="pill current">Active</span><span className="tag navy">Full Management · 9% pcm</span><span className="tag">Client since Mar 2024</span><span className="tag">Prefers WhatsApp</span></div>
              <div className="contact">
                <span><Icon name="mail" />m.okafor@example.co.uk</span>
                <span><Icon name="phone" />07700 900412</span>
                <span><Icon name="chat" />WhatsApp</span>
                <span><Icon name="pin" />Blackheath, London SE3</span>
              </div>
            </div>
          </div>
          <div className="r">
            <button className="btn btn-ghost od" disabled><Icon name="onedrive" />Client folder<Icon name="ext" style={{ width: "13px", color: "var(--ink-mute)" }} /></button>
            <button className="btn btn-ghost" disabled><Icon name="cal" />Log meeting</button>
            <button className="btn btn-primary" disabled><Icon name="plus" />Add action</button>
          </div>
        </div>
        <div className="facts">
          <div className="fact"><div className="k">Properties</div><div className="v">3 managed · London</div></div>
          <div className="fact"><div className="k">Repair approval limit</div><div className="v">£300 without asking</div></div>
          <div className="fact"><div className="k">Portfolio compliance</div><div className="v" style={{ color: "var(--urgent)" }}>1 urgent · 1 due soon</div></div>
          <div className="fact"><div className="k">Open actions</div><div className="v">4 · 1 late</div></div>
        </div>
      </div>

      <div className="two">
        <div className="stack">
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Properties</h2><div className="sub">Compliance health at a glance — click to open</div></div><Link className="btn btn-ghost btn-sm" href="/clients/new"><Icon name="plus" />Add property</Link></div>
            <div className="prop-cards">
              <Link className="prop" href="/properties/lewisham-way">
                <div className="thumb"></div>
                <div><div className="t">Flat 3, 22 Lewisham Way</div><div className="s">London SE14 6NP · Let · tenancy to Jun 2027</div></div>
                <div className="health"><div className="bar"><span style={{ width: "67%", background: "var(--green)" }}></span><span style={{ width: "8%", background: "var(--urgent)" }}></span><span style={{ width: "8%", background: "var(--early)" }}></span><span style={{ width: "17%", background: "#C9CDD3" }}></span></div><small>8 of 12 current · 1 urgent · 2 missing</small></div>
                <span className="pill urgent">EICR in 5d</span>
              </Link>
              <div className="prop">
                <div className="thumb" style={{ background: "linear-gradient(135deg,#C9D3CB,#AFC0B3)" }}></div>
                <div><div className="t">14 Cator Street, Peckham</div><div className="s">London SE15 6AA · Let · assured periodic</div></div>
                <div className="health"><div className="bar"><span style={{ width: "83%", background: "var(--green)" }}></span><span style={{ width: "9%", background: "var(--soon)" }}></span><span style={{ width: "8%", background: "#E4E1DA" }}></span></div><small>10 of 11 current · 1 due soon</small></div>
                <span className="pill soon">Gas in 12d</span>
              </div>
              <div className="prop">
                <div className="thumb" style={{ background: "linear-gradient(135deg,#D6CFD9,#BEB3C4)" }}></div>
                <div><div className="t">27 Wricklemarsh Road</div><div className="s">London SE3 8DN · Void · marketing from 2 Dec</div></div>
                <div className="health"><div className="bar"><span style={{ width: "100%", background: "var(--green)" }}></span></div><small>9 of 9 current · ready to let</small></div>
                <span className="pill current">Compliant</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Actions</h2><div className="sub">Promises to and about Margaret</div></div>
              <div className="segs"><button className="seg on">Open · 4</button><button className="seg">Done · 11</button></div></div>
            <div className="rows">
              <div className="row"><div className="ico red"><Icon name="list" /></div><div><div className="t">Send revised management agreement</div><div className="s">From Teams · 12 Nov review · You</div></div><span className="pill overdue">4d late</span><div className="when mute">15 Nov</div></div>
              <div className="row"><div className="ico orange"><Icon name="bolt" /></div><div><div className="t">Book EICR — Flat 3 (3 quotes)</div><div className="s">From compliance · You → Sparks &amp; Co</div></div><span className="pill urgent">In progress</span><div className="when mute">21 Nov</div></div>
              <div className="row"><div className="ico blue"><Icon name="clock" /></div><div><div className="t">Approve £420 for new extractor fan</div><div className="s">Waiting on Margaret · chased 17 Nov</div></div><span className="pill early">Waiting</span><div className="when mute">22 Nov</div></div>
              <div className="row"><div className="ico green"><Icon name="home" /></div><div><div className="t">Photos &amp; listing for 27 Wricklemarsh Road</div><div className="s">You · marketing starts 2 Dec</div></div><span className="tag">Open</span><div className="when mute">29 Nov</div></div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Client documents</h2><div className="sub">Onboarding, AML and agreements</div></div><button className="btn-link" disabled><Icon name="plus" />Add</button></div>
            <div className="doc"><div><div className="t">AML / photo ID verification</div><div className="s">Passport · review due Mar 2027</div></div><a className="file"><Icon name="onedrive" style={{ width: "14px" }} />ID_check.pdf</a><span className="pill current">Current</span></div>
            <div className="doc"><div><div className="t">Proof of ownership</div><div className="s">Land Registry title · 3 properties</div></div><a className="file"><Icon name="onedrive" style={{ width: "14px" }} />Titles/</a><span className="pill current">Current</span></div>
            <div className="doc"><div><div className="t">Management agreement</div><div className="s">Revised terms promised 12 Nov</div></div><a className="file"><Icon name="onedrive" style={{ width: "14px" }} />TOB_2024.pdf</a><span className="pill soon">Update due</span></div>
            <div className="doc"><div><div className="t">Bank / rent remittance mandate</div><div className="s">Not yet on file</div></div><span className="file none">No link</span><span className="pill missing">Missing</span></div>
            <div className="doc"><div><div className="t">NRL1 (non-resident landlord)</div><div className="s">UK resident</div></div><span className="file none">—</span><span className="pill na">N/A</span></div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Activity</h2><div className="sub">Meetings, emails and changes</div></div></div>
            <div className="timeline">
              <div className="tl"><div className="b"><Icon name="mail" /></div><div><div className="t">EICR 7-day reminder drafted</div><div className="s">Today 07:15 · in Outlook Drafts</div></div></div>
              <div className="tl"><div className="b"><Icon name="chat" /></div><div><div className="t">WhatsApp chase — extractor fan approval</div><div className="s">17 Nov · logged by you</div></div></div>
              <div className="tl"><div className="b"><Icon name="cal" /></div><div><div className="t">Quarterly review (Teams)</div><div className="s">12 Nov · 3 actions created · 2 done</div></div></div>
              <div className="tl"><div className="b"><Icon name="check" /></div><div><div className="t">Gas Safety renewed — 27 Wricklemarsh Rd</div><div className="s">4 Nov · new expiry 3 Nov 2027</div></div></div>
            </div>
          </div>
        </div>
      </div>

    </Shell>
  );
}
