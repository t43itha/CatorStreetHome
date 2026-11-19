import Link from "next/link";
import { connection } from "next/server";
import { buildDemo, type IconName } from "@/lib/demo.ts";
import { buildHome } from "@/lib/home.ts";
import { todayLondon } from "@/lib/status.ts";
import { Icon } from "./Icons.tsx";

export type NavKey = "home" | "clients" | "properties" | "actions" | "meetings" | "email";

const NAV: Array<{ key: NavKey; label: string; icon: IconName; href: string; group?: string }> = [
  { key: "home", label: "Home", icon: "home", href: "/" },
  { key: "clients", label: "Clients", icon: "users", href: "/clients/okafor" },
  { key: "properties", label: "Properties", icon: "building", href: "/properties/lewisham-way" },
  { key: "actions", label: "Actions", icon: "list", href: "/commitments", group: "Follow-through" },
  { key: "meetings", label: "Meetings", icon: "cal", href: "/meetings/whitfield-review" },
  { key: "email", label: "Email Centre", icon: "mail", href: "/emails" },
];

const LATER: Array<{ label: string; icon: IconName; step: string }> = [
  { label: "Import Excel", icon: "upload", step: "1.7" },
  { label: "Settings", icon: "cog", step: "1.7" },
];

/** App shell from the approved mockup. Every page renders per request because status depends on today's London date. */
export async function Shell({ active, children }: { active: NavKey; children: React.ReactNode }) {
  await connection();
  const today = todayLondon();
  const urgentCount = buildHome(buildDemo(today), today).urgent.length;

  return (
    <div className="app">
      <aside className="side">
        <div className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cator-logo.png" alt="Cator Street" />
          <div><b>Command</b></div>
        </div>
        {NAV.map((item) => (
          <div key={item.key} style={{ display: "contents" }}>
            {item.group && <div className="nav-label">{item.group}</div>}
            <Link className={`nav-item${item.key === active ? " active" : ""}`} href={item.href}>
              <Icon name={item.icon} />{item.label}
              {item.key === "home" && <span className="count">{urgentCount}</span>}
            </Link>
          </div>
        ))}
        <div className="nav-label">Admin</div>
        {LATER.map((item) => (
          <span key={item.label} className="nav-item" aria-disabled="true" title={`Not built yet (Phase 1, step ${item.step})`}>
            <Icon name={item.icon} />{item.label}
          </span>
        ))}
        <div className="foot">
          <div className="m365"><span className="dot off" />Microsoft 365 not connected</div>
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <div className="search" title="Search arrives with the Convex data">
            <Icon name="search" />Search landlords, postcodes, certificates, actions…<kbd>⌘K</kbd>
          </div>
          <span className="demo">Demo data</span>
          <div className="spacer" />
          <button className="btn btn-primary" disabled title="Quick capture arrives with the Convex data">
            <Icon name="plus" />Quick capture
          </button>
          <div className="avatar">TO</div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
