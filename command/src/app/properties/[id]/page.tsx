import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell.tsx";
import { Icon } from "@/components/Icons.tsx";
import { Act } from "@/components/Act.tsx";
import { ComplianceRows, ComplianceScore } from "@/components/ComplianceMatrix.tsx";
import { NewAction } from "@/components/forms.tsx";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api, read } from "@/lib/data.ts";
import { formatShortDate, todayLondon } from "@/lib/status.ts";

const LICENCE = { none: "No licence required", selective: "Selective licence", additional: "Additional licence", hmo: "HMO licence" } as const;
const gbp = (n?: number) => (n === undefined ? "—" : `£${n.toLocaleString("en-GB")}`);
const longDate = (iso?: string) => (iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`)) : "—");

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const today = todayLondon();
  const data = await read(api.views.property, { id: id as Id<"properties">, today }).catch(() => null);
  if (!data) notFound();
  const { property: p, client: c, tenancy: t, items, actions, activity } = data;

  return (
    <Shell active="properties">
      <div className="crumbs"><Link href="/clients">Clients</Link><span>/</span><Link href={`/clients/${c._id}`}>{c.name}</Link><span>/</span><span>{p.addressLine1}</span></div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="entity" style={{ marginBottom: 0 }}>
          <div className="l">
            <div className="thumb" style={{ width: 84, height: 64, borderRadius: 10 }} />
            <div>
              <h1>{p.addressLine1}</h1>
              <div className="contact" style={{ marginTop: 6 }}><span><Icon name="pin" />{p.postcode} · {p.area}</span><span><Icon name="users" />Landlord: <Link href={`/clients/${c._id}`} style={{ color: "var(--green)", fontWeight: 600, marginLeft: 3 }}>{c.name}</Link></span></div>
              <div className="tags">
                <span className="tag navy">{c.serviceTier}</span>
                <span className={`pill ${p.status === "onboarding" ? "soon" : t ? "current" : "na"}`}>{p.status === "onboarding" ? "Onboarding" : t ? "Let" : "Void"}</span>
                <span className="tag">{p.hasGas ? "Gas supply" : "No gas"}</span>
                <span className="tag">{LICENCE[p.licenceType]}</span>
              </div>
            </div>
          </div>
          <div className="r">
            {p.oneDriveFolderUrl && <a className="btn btn-ghost od" href={p.oneDriveFolderUrl} target="_blank" rel="noreferrer"><Icon name="onedrive" />Property folder<Icon name="ext" style={{ width: 13, color: "var(--ink-mute)" }} /></a>}
            {p.status === "onboarding" && <Act fn="onboarding:activateProperty" args={{ propertyId: p._id, draftRequestEmail: true }} label="Activate property" className="btn btn-ghost" done="Property active · reminders start from the next scan" />}
            <NewAction text={<><Icon name="plus" />Add action</>} clientId={c._id} propertyId={p._id} />
          </div>
        </div>
      </div>

      <div className="two" style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}>
        <div className="card">
          <div className="card-head">
            <div><h2 className="card-title">Compliance</h2><div className="sub">Statutory dates vs. CSPS reminder targets</div></div>
            <ComplianceScore rows={items} today={today} />
          </div>
          <div className="scroll-x"><table className="matrix">
            <thead><tr><th>Document</th><th>Status</th><th>Expires</th><th>Remind by</th><th>File</th><th>Owner</th><th></th></tr></thead>
            <ComplianceRows rows={items} today={today} />
          </table></div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Tenancy</h2><div className="sub">{t ? "Current let" : "No current tenancy"}</div></div></div>
            {t && (
              <div className="ten">
                <div><div className="k">Tenant</div><div className="v">{(t.tenants ?? []).map((x) => x.name).join(", ") || "—"}</div></div>
                <div><div className="k">Rent</div><div className="v">{t.rentGbp ? `${gbp(t.rentGbp)} pcm` : "—"}</div></div>
                <div><div className="k">Start</div><div className="v">{longDate(t.startDate)}</div></div>
                <div><div className="k">Type</div><div className="v">Assured periodic</div></div>
                <div><div className="k">Notice given</div><div className="v">{t.noticeGivenBy ? `By ${t.noticeGivenBy} · ends ${longDate(t.expectedEndDate)}` : "None"}</div></div>
                <div><div className="k">Deposit</div><div className="v">{gbp(t.depositAmountGbp)}{t.depositScheme ? ` · ${t.depositScheme}` : ""}</div></div>
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Open actions</h2></div><NewAction className="btn-link" text={<><Icon name="plus" />Add</>} clientId={c._id} propertyId={p._id} /></div>
            <div className="rows">
              {actions.length === 0 && <div className="empty">Nothing open.</div>}
              {actions.map((a) => (
                <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }} key={a.id}>
                  <div><div className="t">{a.title}</div><div className="s">{a.details ?? ""}{a.dueDate ? ` · due ${formatShortDate(a.dueDate)}` : ""}</div></div>
                  {a.ownerType === "you"
                    ? <Act fn="commitments:complete" args={{ id: a.id }} label="Done" done="Action marked done" />
                    : <Act fn="commitments:logChase" args={{ id: a.id }} label="Chase" done="Chase logged" />}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Recent</h2></div></div>
            <div className="timeline">
              {activity.length === 0 && <div style={{ color: "var(--ink-mute)", fontSize: 13 }}>No activity yet.</div>}
              {activity.map((a) => (
                <div className="tl" key={a._id}><div className="b"><Icon name="check" /></div>
                  <div><div className="t">{a.summary}</div><div className="s">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }).format(a.createdAt)}</div></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
