import { Icon } from "@/components/Icons.tsx";
import { Shell } from "@/components/Shell.tsx";

// Ported from the approved mockup. Demo content; real data arrives with Convex (plan Step 1.2).
export default function EmailCentrePage() {
  return (
    <Shell active="email">
      <div className="page-head">
        <div><span className="eyebrow">Email Centre</span><h1 className="page">Renewal drafts</h1><p className="lede">Created each morning at 07:15 and placed in your Outlook Drafts. Nothing is sent without you.</p></div>
        <div className="segs"><button className="seg on">Drafts · 3</button><button className="seg">Sent log</button><button className="seg">Logged threads · 4</button></div>
      </div>
      <div className="card mail">
        <div className="mail-list">
          <div className="mail-item sel"><div className="top-l"><span>Margaret Okafor</span><span>07:15</span></div><div className="t">EICR renewal — Flat 3, 22 Lewisham Way</div><div className="s">Our records show the Electrical Installation Condition Report…</div><div className="chips"><span className="pill urgent">7-day</span><span className="tag">In Outlook</span></div></div>
          <div className="mail-item"><div className="top-l"><span>David &amp; Priya Shah</span><span>07:15</span></div><div className="t">Gas Safety Certificate — overdue</div><div className="s">The gas safety certificate for 7 Rochester Road expired on…</div><div className="chips"><span className="pill overdue">Overdue</span><span className="tag">In Outlook</span></div></div>
          <div className="mail-item"><div className="top-l"><span>Margaret Okafor</span><span>07:15</span></div><div className="t">Gas Safety renewal — 14 Cator Street</div><div className="s">A quick reminder that the gas safety certificate is due…</div><div className="chips"><span className="pill soon">14-day</span><span className="tag">In Outlook</span></div></div>
          <div className="section-label" style={{ borderTop: "1px solid var(--line-soft)" }}>Sent this month</div>
          <div className="mail-item" style={{ opacity: ".65" }}><div className="top-l"><span>James Whitfield</span><span>12 Nov</span></div><div className="t">Insurance renewal — 41 Maidstone Road</div><div className="chips"><span className="tag green">Sent</span></div></div>
          <div className="mail-item" style={{ opacity: ".65" }}><div className="top-l"><span>Grace Adeyemi</span><span>4 Nov</span></div><div className="t">EPC renewal heads-up — 9 Blackheath Park</div><div className="chips"><span className="tag green">Sent</span></div></div>
        </div>
        <div className="mail-view">
          <div className="context-box">
            <Icon name="bolt" style={{ color: "var(--urgent)" }} />
            <span><b>EICR</b> · Flat 3, 22 Lewisham Way · expires <b>24 Nov 2026</b> · 30-day notice sent 26 Oct</span>
            <span className="dedupe"><Icon name="shield" style={{ width: "13px" }} />One draft per stage</span>
          </div>
          <div className="mail-meta">
            <span className="k">To</span><span>Margaret Okafor &lt;m.okafor@example.co.uk&gt;</span>
            <span className="k">From</span><span>Cator Street Property Services &lt;info@catorstreet.com&gt;</span>
          </div>
          <h2 className="mail-subject">EICR renewal due — Flat 3, 22 Lewisham Way</h2>
          <div className="mail-body">
            <p>Dear <mark>Margaret</mark>,</p>
            <p>I hope you are well. Our records show the Electrical Installation Condition Report (EICR) for <mark>Flat 3, 22 Lewisham Way, SE14 6NP</mark> expires on <mark>24 November 2026</mark>, which is five days away.</p>
            <p>We have asked Sparks &amp; Co for quotes and expect to confirm a date this week. If you would prefer to use your own electrician, please let me know today so we can keep the property compliant.</p>
            <p>Once the inspection is complete, I will upload the new report to your property folder and send you a copy.</p>
            <p>Kind regards,<br />Tabitha<br />Cator Street Property Services</p>
          </div>
          <div className="mail-foot">
            <button className="btn btn-primary" disabled><Icon name="ext" />Open in Outlook</button>
            <button className="btn btn-ghost" disabled>Edit here</button>
            <button className="btn btn-ghost" disabled><Icon name="send" />Mark sent</button>
            <button className="btn btn-ghost" disabled style={{ marginLeft: "auto", color: "var(--ink-mute)" }}>Dismiss</button>
          </div>
        </div>
      </div>

    </Shell>
  );
}
