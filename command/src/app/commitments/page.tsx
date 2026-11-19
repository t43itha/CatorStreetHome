import { Icon } from "@/components/Icons.tsx";
import { Shell } from "@/components/Shell.tsx";
import { ActionsTabs } from "@/components/ActionsTabs.tsx";

// Ported from the approved mockup. Demo content; real data arrives with Convex (plan Step 1.2).
export default function ActionsPage() {
  return (
    <Shell active="actions">
      <div className="page-head">
        <div><span className="eyebrow">Follow-through</span><h1 className="page">Actions</h1><p className="lede">Everything promised in meetings, emails and compliance checks — with one owner and one date.</p></div>
        <button className="btn btn-primary" disabled><Icon name="plus" />New action</button>
      </div>
      <ActionsTabs
        board={<>
        <div className="col">
          <div className="col-h"><span style={{ color: "var(--overdue)" }}>Overdue</span><span className="c">3</span></div>
          <div className="task"><div className="t">Send revised management agreement</div><div className="ctx">Margaret Okafor</div><div className="f"><span className="src"><Icon name="cal" />Teams · 12 Nov</span><span className="due" style={{ color: "var(--overdue)" }}>4d late</span><span className="owner" style={{ background: "var(--navy)" }}>TO</span></div></div>
          <div className="task"><div className="t">Chase Kent Heating for boiler quote</div><div className="ctx">7 Rochester Road · Shah</div><div className="f"><span className="src"><Icon name="mail" />Email · 6 Nov</span><span className="due" style={{ color: "var(--overdue)" }}>2d late</span><span className="owner" style={{ background: "#A15C07" }}>KH</span></div></div>
          <div className="task"><div className="t">Renew CP12 — book Southern Gas</div><div className="ctx">7 Rochester Road · Shah</div><div className="f"><span className="src"><Icon name="shield" />Compliance</span><span className="due" style={{ color: "var(--overdue)" }}>3d late</span><span className="owner" style={{ background: "var(--navy)" }}>TO</span></div></div>
        </div>
        <div className="col">
          <div className="col-h"><span>This week</span><span className="c">5</span></div>
          <div className="task"><div className="t">Book EICR — get 3 quotes</div><div className="ctx">Flat 3, 22 Lewisham Way</div><div className="f"><span className="src"><Icon name="shield" />Compliance</span><span className="due" style={{ color: "var(--urgent)" }}>Fri 21</span><span className="owner" style={{ background: "var(--navy)" }}>TO</span></div></div>
          <div className="task"><div className="t">Send James updated rent statement</div><div className="ctx">James Whitfield</div><div className="f"><span className="src"><Icon name="cal" />Teams · today</span><span className="due">Fri 21</span><span className="owner" style={{ background: "var(--navy)" }}>TO</span></div></div>
          <div className="task"><div className="t">Reply to Chloe re: bathroom damp</div><div className="ctx">9 Blackheath Park</div><div className="f"><span className="src"><Icon name="mail" />Email · 17 Nov</span><span className="due">Fri 21</span><span className="owner" style={{ background: "var(--navy)" }}>TO</span></div></div>
          <div className="task"><div className="t">Approve extractor fan (£420)</div><div className="ctx">Flat 3 · Margaret Okafor</div><div className="f"><span className="src"><Icon name="chat" />WhatsApp</span><span className="due">Sat 22</span><span className="owner" style={{ background: "#5A6E96" }}>MO</span></div></div>
        </div>
        <div className="col">
          <div className="col-h"><span>Next 30 days</span><span className="c">6</span></div>
          <div className="task"><div className="t">Request new RTR share code</div><div className="ctx">41 Maidstone Road · tenant</div><div className="f"><span className="src"><Icon name="shield" />Compliance</span><span className="due">25 Nov</span><span className="owner" style={{ background: "#5B8C66" }}>TN</span></div></div>
          <div className="task"><div className="t">Photos &amp; listing — Wricklemarsh Rd</div><div className="ctx">Margaret Okafor</div><div className="f"><span className="src"><Icon name="list" />Manual</span><span className="due">29 Nov</span><span className="owner" style={{ background: "var(--navy)" }}>TO</span></div></div>
          <div className="task"><div className="t">Insurance renewal proof</div><div className="ctx">41 Maidstone Road · James</div><div className="f"><span className="src"><Icon name="shield" />Compliance</span><span className="due">13 Dec</span><span className="owner" style={{ background: "#5A6E96" }}>JW</span></div></div>
        </div>
        <div className="col" style={{ background: "#EEF3EF" }}>
          <div className="col-h"><span style={{ color: "var(--green)" }}>Done this week</span><span className="c">8</span></div>
          <div className="task" style={{ opacity: ".7" }}><div className="t" style={{ textDecoration: "line-through", textDecorationColor: "var(--ink-mute)" }}>Serve section 13 notice — Shah</div><div className="f"><span className="src"><Icon name="check" />18 Nov</span><span className="owner" style={{ background: "var(--navy)" }}>TO</span></div></div>
          <div className="task" style={{ opacity: ".7" }}><div className="t" style={{ textDecoration: "line-through", textDecorationColor: "var(--ink-mute)" }}>Upload CP12 — Wricklemarsh Rd</div><div className="f"><span className="src"><Icon name="check" />17 Nov</span><span className="owner" style={{ background: "var(--navy)" }}>TO</span></div></div>
        </div>
        </>}
        waiting={<div className="scroll-x">
        <table className="wtable">
          <thead><tr><th>Waiting for</th><th>From</th><th>Property / client</th><th>Silent for</th><th>Last chase</th><th></th></tr></thead>
          <tbody>
            <tr><td><b>Boiler replacement quote</b></td><td>Kent Heating Ltd <span className="tag" style={{ marginLeft: "4px" }}>Contractor</span></td><td>7 Rochester Road · Shah</td><td><div className="stale"><div className="bar"><span style={{ width: "100%", background: "var(--overdue)" }}></span></div><b style={{ color: "var(--overdue)" }}>6 days</b></div></td><td className="lc">13 Nov · phone</td><td><button className="btn btn-ghost btn-sm chase" disabled>Log chase</button></td></tr>
            <tr><td><b>Approval for extractor fan (£420)</b></td><td>Margaret Okafor <span className="tag" style={{ marginLeft: "4px" }}>Landlord</span></td><td>Flat 3, 22 Lewisham Way</td><td><div className="stale"><div className="bar"><span style={{ width: "40%", background: "var(--soon)" }}></span></div><b style={{ color: "var(--soon)" }}>2 days</b></div></td><td className="lc">17 Nov · WhatsApp</td><td><button className="btn btn-ghost btn-sm chase" disabled>Log chase</button></td></tr>
            <tr><td><b>New Right to Rent share code</b></td><td>Daniel Osei <span className="tag" style={{ marginLeft: "4px" }}>Tenant</span></td><td>41 Maidstone Road · Whitfield</td><td><div className="stale"><div className="bar"><span style={{ width: "20%", background: "var(--early)" }}></span></div><b>1 day</b></div></td><td className="lc">18 Nov · email</td><td><button className="btn btn-ghost btn-sm chase" disabled>Log chase</button></td></tr>
            <tr><td><b>Signed renewal for buildings insurance</b></td><td>James Whitfield <span className="tag" style={{ marginLeft: "4px" }}>Landlord</span></td><td>41 Maidstone Road</td><td><div className="stale"><div className="bar"><span style={{ width: "10%", background: "var(--early)" }}></span></div><b>Today</b></div></td><td className="lc">—</td><td><button className="btn btn-ghost btn-sm chase" disabled>Log chase</button></td></tr>
            <tr><td><b>Licence application acknowledgement</b></td><td>Medway Council <span className="tag" style={{ marginLeft: "4px" }}>Council</span></td><td>7 Rochester Road · Shah</td><td><div className="stale"><div className="bar"><span style={{ width: "85%", background: "var(--overdue)" }}></span></div><b style={{ color: "var(--overdue)" }}>11 days</b></div></td><td className="lc">8 Nov · portal</td><td><button className="btn btn-ghost btn-sm chase" disabled>Log chase</button></td></tr>
          </tbody>
        </table>
        </div>}
      />

    </Shell>
  );
}
