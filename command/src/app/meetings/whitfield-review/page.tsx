import { Icon } from "@/components/Icons.tsx";
import { Shell } from "@/components/Shell.tsx";

// Ported from the approved mockup. Demo content; real data arrives with Convex (plan Step 1.2).
export default function MeetingPage() {
  return (
    <Shell active="meetings">
              <div className="crumbs"><a>Meetings</a><span>/</span><span>Quarterly review — James Whitfield</span></div>
              <div className="page-head">
                <div>
                  <h1 className="page" style={{ marginTop: "0" }}>Quarterly review — James Whitfield</h1>
                  <div className="contact"><span><Icon name="cal" />Today · 10:30–11:05</span><span><Icon name="chat" />Microsoft Teams</span><span><Icon name="building" />41 Maidstone Road, Gillingham ME7</span><span><Icon name="users" />You, James Whitfield</span></div>
                </div>
                <span className="tag green">3 actions tracked</span>
              </div>

              <div className="two" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                <div className="card">
                  <div className="card-head"><div><h2 className="card-title">Notes</h2><div className="sub">Pasted from Teams · highlighted lines became actions</div></div></div>
                  <div className="card-body">
      <div className="notes">
        James calling from Dubai — happy with the current tenants, rent paid on time since June.{"\n"}
        {"\n"}
        Tenant Daniel's visa ends 25 Nov. <span className="hl">I'll request a new Right to Rent share code from Daniel by Tuesday.</span>{"\n"}
        {"\n"}
        Buildings insurance renews 13 Dec — James to send renewed policy. <span className="hl">James will email the signed insurance renewal by 10 Dec.</span>{"\n"}
        {"\n"}
        Rent review due 9 Jan. James wants to raise the rent to £1,475 (up from £1,425).{"\n"}
        <span className="hl">I'll send James an updated rent statement and the rent increase paperwork by Friday.</span>{"\n"}
        {"\n"}
        Agreed: no rent increase above £1,475 this year. NRL1 still valid — no action.
      </div>
                  </div>
                </div>

                <div className="stack">
                  <div className="card">
                    <div className="card-head"><div><h2 className="card-title">Action items</h2><div className="sub">Each one becomes a tracked action</div></div><span className="pill current">Created</span></div>
                    <div className="action"><span className="check"><Icon name="check" /></span><div><div className="t">Request new Right to Rent share code from Daniel</div><div className="fields"><span className="field">Owner <b>You</b></span><span className="field">Waiting on <b>Daniel Osei (tenant)</b></span><span className="field">Due <b>Tue 24 Nov</b></span><span className="field">Links <b>RTR document</b></span></div></div></div>
                    <div className="action"><span className="check"><Icon name="check" /></span><div><div className="t">Email signed buildings insurance renewal</div><div className="fields"><span className="field">Owner <b>James Whitfield</b></span><span className="field">Due <b>Thu 10 Dec</b></span><span className="field">Links <b>Insurance</b></span></div></div></div>
                    <div className="action"><span className="check"><Icon name="check" /></span><div><div className="t">Send updated rent statement and rent increase paperwork</div><div className="fields"><span className="field">Owner <b>You</b></span><span className="field">Due <b>Fri 21 Nov</b></span><span className="field">Priority <b>High</b></span></div></div></div>
                  </div>
                  <div className="card">
                    <div className="card-head"><div><h2 className="card-title">Decisions</h2><div className="sub">Saved to James's timeline</div></div></div>
                    <div className="decision"><Icon name="check" /><span>Raise the rent to <b>£1,475 pcm</b> from 9 Jan.</span></div>
                    <div className="decision"><Icon name="check" /><span>No further rent increase this year.</span></div>
                    <div className="decision" style={{ paddingBottom: "16px" }}><Icon name="check" /><span>NRL1 approval remains valid; no action needed.</span></div>
                  </div>
                </div>
              </div>

    </Shell>
  );
}
