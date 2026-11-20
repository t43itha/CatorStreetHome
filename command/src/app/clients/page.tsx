import Link from "next/link";
import { Shell } from "@/components/Shell.tsx";
import { Icon } from "@/components/Icons.tsx";
import { HealthBar, healthText, WorstPill } from "@/components/bits.tsx";
import { api, read } from "@/lib/data.ts";
import { todayLondon } from "@/lib/status.ts";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "all", q = "" } = await searchParams;
  const all = await read(api.views.clients, { today: todayLondon() });
  const needle = q.toLowerCase();
  const list = all.filter((c) => (status === "all" || c.status === status) && (!needle || c.name.toLowerCase().includes(needle)));
  const tabs = ["all", "active", "onboarding", "prospect", "former"];
  return (
    <Shell active="clients">
      <div className="page-head">
        <div><span className="eyebrow">Clients</span><h1 className="page">Landlords</h1><p className="lede">{all.length} clients · {all.filter((c) => c.status === "onboarding").length} onboarding</p></div>
        <Link className="btn btn-primary" href="/clients/new"><Icon name="plus" />Add client</Link>
      </div>
      <div className="tabs">
        {tabs.map((t) => <Link key={t} className={`tab${t === status ? " on" : ""}`} href={t === "all" ? "/clients" : `/clients?status=${t}`}>{t[0].toUpperCase() + t.slice(1)} <span className="c">{t === "all" ? all.length : all.filter((c) => c.status === t).length}</span></Link>)}
      </div>
      <div className="card">
        <div className="prop-cards">
          {list.length === 0 && <div className="empty">No clients here yet.</div>}
          {list.map((c) => (
            <Link key={c.id} className="prop" href={c.status === "onboarding" ? `/clients/${c.id}/onboarding` : `/clients/${c.id}`}>
              <div className="big-av" style={{ width: 48, height: 48, fontSize: 18, borderRadius: 10 }}>{c.name.split(/\s+|&/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("")}</div>
              <div><div className="t">{c.name}{c.isOverseas && <span className="tag" style={{ marginLeft: 6 }}>Overseas</span>}</div><div className="s">{c.serviceTier} · {c.properties} propert{c.properties === 1 ? "y" : "ies"} · {c.openActions} open actions</div></div>
              <div className="health"><HealthBar h={c.health} /><small>{healthText(c.health)}</small></div>
              {c.status === "onboarding" ? <span className="pill soon">Onboarding</span> : <WorstPill h={c.health} />}
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
