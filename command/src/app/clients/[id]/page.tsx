import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell.tsx";
import { Icon } from "@/components/Icons.tsx";
import { Act } from "@/components/Act.tsx";
import { HealthBar, healthText, initials, WorstPill } from "@/components/bits.tsx";
import { MarkNotApplicable, NewAction, RecordEvidence } from "@/components/forms.tsx";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api, read } from "@/lib/data.ts";
import { diffCalendarDays, formatShortDate, STATUS_LABEL, todayLondon } from "@/lib/status.ts";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const today = todayLondon();
  const data = await read(api.views.client, { id: id as Id<"clients">, today }).catch(() => null);
  if (!data) notFound();
  const { client: c, properties, docs, actions, activity, portfolio } = data;
  const open = actions.filter((a) => a.status !== "done");
  const late = open.filter((a) => a.ownerType === "you" && a.dueDate && a.dueDate < today).length;

  return (
    <Shell active="clients">
      <div className="crumbs"><Link href="/clients">Clients</Link><span>/</span><span>{c.name}</span>
        <Link className="btn-link" style={{ marginLeft: "auto" }} href="/clients/new"><Icon name="plus" />Add client</Link></div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="entity" style={{ marginBottom: 0 }}>
          <div className="l">
            <div className="big-av">{initials(c.name)}</div>
            <div>
              <h1>{c.name}</h1>
              <div className="tags">
                <span className={`pill ${c.status === "active" ? "current" : c.status === "onboarding" ? "soon" : "na"}`}>{c.status[0].toUpperCase() + c.status.slice(1)}</span>
                <span className="tag navy">{c.serviceTier}</span>
                {c.isOverseas && <span className="tag">Overseas</span>}
                {c.preferredChannel && <span className="tag">Prefers {c.preferredChannel}</span>}
              </div>
              <div className="contact">
                {c.email && <a href={`mailto:${c.email}`}><Icon name="mail" />{c.email}</a>}
                {c.phone && <a href={`tel:${c.phone.replace(/\s/g, "")}`}><Icon name="phone" />{c.phone}</a>}
                {c.phone && <a href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "44")}`} target="_blank" rel="noreferrer"><Icon name="chat" />WhatsApp</a>}
              </div>
            </div>
          </div>
          <div className="r">
            {c.oneDriveFolderUrl && <a className="btn btn-ghost od" href={c.oneDriveFolderUrl} target="_blank" rel="noreferrer"><Icon name="onedrive" />Client folder<Icon name="ext" style={{ width: 13, color: "var(--ink-mute)" }} /></a>}
            {c.status === "onboarding" && <Link className="btn btn-ghost" href={`/clients/${c._id}/onboarding`}>Resume onboarding</Link>}
            <NewAction text={<><Icon name="plus" />Add action</>} clientId={c._id} />
          </div>
        </div>
        <div className="facts">
          <div className="fact"><div className="k">Properties</div><div className="v">{properties.length} managed</div></div>
          <div className="fact"><div className="k">Repair approval limit</div><div className="v">{c.repairLimitGbp ? `£${c.repairLimitGbp} without asking` : "Not set"}</div></div>
          <div className="fact"><div className="k">Portfolio compliance</div><div className="v" style={{ color: portfolio.overdue + portfolio.urgent ? "var(--urgent)" : undefined }}>{portfolio.overdue + portfolio.urgent} urgent · {portfolio.soon} due soon · {portfolio.missing} missing</div></div>
          <div className="fact"><div className="k">Open actions</div><div className="v">{open.length}{late ? ` · ${late} late` : ""}</div></div>
        </div>
      </div>

      <div className="two">
        <div className="stack">
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Properties</h2><div className="sub">Compliance health at a glance — click to open</div></div>
              <Link className="btn btn-ghost btn-sm" href={`/clients/${c._id}/onboarding`}><Icon name="plus" />Add property</Link></div>
            <div className="prop-cards">
              {properties.length === 0 && <div className="empty">No properties yet.</div>}
              {properties.map((p) => (
                <Link key={p.id} className="prop" href={`/properties/${p.id}`}>
                  <div className="thumb" />
                  <div><div className="t">{p.address}</div><div className="s">{p.postcode} · {p.status === "onboarding" ? "Onboarding" : p.isLet ? "Let · assured periodic" : "Void"}</div></div>
                  <div className="health"><HealthBar h={p.health} /><small>{healthText(p.health)}</small></div>
                  <WorstPill h={p.health} />
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Actions</h2><div className="sub">Promises to and about {c.name.split(" ")[0]}</div></div><span className="tag">Open · {open.length}</span></div>
            <div className="rows">
              {open.length === 0 && <div className="empty">Nothing open.</div>}
              {open.map((a) => {
                const lateBy = a.ownerType === "you" && a.dueDate ? -diffCalendarDays(a.dueDate, today) : 0;
                return (
                  <div className="row" key={a.id}>
                    <div className={`ico ${lateBy > 0 ? "red" : a.ownerType === "you" ? "orange" : "blue"}`}><Icon name={a.ownerType === "you" ? "list" : "clock"} /></div>
                    <div><div className="t">{a.title}</div><div className="s">{a.details ?? ""}{a.lastChasedAt ? ` · chased ${formatShortDate(a.lastChasedAt)}` : ""}</div></div>
                    <div className="acts">{a.ownerType === "you"
                      ? <Act fn="commitments:complete" args={{ id: a.id }} label="Done" done="Action marked done" />
                      : <Act fn="commitments:logChase" args={{ id: a.id }} label="Log chase" done="Chase logged" />}</div>
                    <div className={`when ${lateBy > 0 ? "red" : "mute"}`}>{lateBy > 0 ? `${lateBy}d late` : a.dueDate ? formatShortDate(a.dueDate) : a.ownerType === "you" ? "" : "Waiting"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Client documents</h2><div className="sub">Onboarding, AML and agreements</div></div></div>
            {docs.map((d) => (
              <div className="doc" key={d.id}>
                <div><div className="t">{d.label}</div><div className="s">{d.isNotApplicable ? d.matrix?.meta ?? "Not applicable" : d.satisfiedAt ? `Recorded ${formatShortDate(d.satisfiedAt)}` : d.dueDate ? `Review due ${formatShortDate(d.dueDate)}` : "Not yet on file"}</div></div>
                <div className="row-acts">
                  {!d.satisfiedAt && !d.isNotApplicable && <RecordEvidence obligationId={d.id} templateCode={d.templateCode} label={d.label} text="Record" />}
                  {!d.satisfiedAt && !d.isNotApplicable && <MarkNotApplicable obligationId={d.id} />}
                </div>
                <span className={`pill ${d.status}`}>{STATUS_LABEL[d.status]}</span>
              </div>
            ))}
            {docs.length === 0 && <div className="empty">No client documents tracked.</div>}
          </div>

          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Activity</h2><div className="sub">Changes, chases and emails</div></div></div>
            <div className="timeline">
              {activity.length === 0 && <div className="s" style={{ color: "var(--ink-mute)", fontSize: 13 }}>No activity yet.</div>}
              {activity.map((a) => (
                <div className="tl" key={a._id}><div className="b"><Icon name={a.action === "sent" ? "mail" : a.action === "chased" ? "chat" : "check"} /></div>
                  <div><div className="t">{a.summary}</div><div className="s">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(a.createdAt)}</div></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
