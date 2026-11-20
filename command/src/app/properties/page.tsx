import Link from "next/link";
import { Shell } from "@/components/Shell.tsx";
import { HealthBar, healthText, WorstPill } from "@/components/bits.tsx";
import { api, read } from "@/lib/data.ts";
import { todayLondon } from "@/lib/status.ts";

const FILTERS = [
  { key: "all", label: "All" }, { key: "overdue", label: "Overdue" }, { key: "soon", label: "Due ≤30d" }, { key: "missing", label: "Missing" },
  { key: "compliant", label: "Compliant" }, { key: "onboarding", label: "Onboarding" },
] as const;

type Row = { postcode: string; status?: string; health: { overdue: number; urgent: number; soon: number; missing: number } };
const isKent = (postcode: string) => /^(ME|CT|TN|DA)\d/.test(postcode);
function matches(p: Row, f: string) {
  const urgent = p.health.overdue + p.health.urgent;
  return f === "all" || (f === "overdue" && urgent > 0) || (f === "soon" && p.health.soon > 0) || (f === "missing" && p.health.missing > 0) ||
    (f === "compliant" && urgent + p.health.missing + p.health.soon === 0) || (f === "onboarding" && p.status === "onboarding");
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<{ f?: string; area?: string }> }) {
  const { f = "all", area } = await searchParams;
  const all = await read(api.views.properties, { today: todayLondon() });
  const inArea = all.filter((p) => !area || (area === "Kent") === isKent(p.postcode));
  const list = inArea.filter((p) => matches(p, f));
  return (
    <Shell active="properties">
      <div className="page-head">
        <div><span className="eyebrow">Portfolio</span><h1 className="page">Properties</h1><p className="lede">{all.length} properties across London and Kent</p></div>
        <div className="segs">
          {[undefined, "London", "Kent"].map((a) => <Link key={a ?? "all"} className={`seg${area === a ? " on" : ""}`} href={`/properties?${new URLSearchParams({ ...(f !== "all" ? { f } : {}), ...(a ? { area: a } : {}) })}`}>{a ?? "All areas"}</Link>)}
        </div>
      </div>
      <div className="tabs">
        {FILTERS.map((x) => <Link key={x.key} className={`tab${x.key === f ? " on" : ""}`} href={`/properties?${new URLSearchParams({ ...(x.key !== "all" ? { f: x.key } : {}), ...(area ? { area } : {}) })}`}>{x.label} <span className="c">{inArea.filter((p) => matches(p, x.key)).length}</span></Link>)}
      </div>
      <div className="card">
        <div className="prop-cards">
          {list.length === 0 && <div className="empty">No properties match.</div>}
          {list.map((p) => (
            <Link key={p.id} className="prop" href={`/properties/${p.id}`}>
              <div className="thumb" />
              <div><div className="t">{p.address}</div><div className="s">{p.postcode} · {p.client} · {p.tenancy}</div></div>
              <div className="health"><HealthBar h={p.health} /><small>{healthText(p.health)}</small></div>
              <WorstPill h={p.health} />
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
