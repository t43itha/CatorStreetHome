import Link from "next/link";
import { connection } from "next/server";
import { getCommandData } from "@/lib/data.ts";
import type { IconName } from "@/lib/model.ts";
import { buildHome } from "@/lib/home.ts";
import { todayLondon } from "@/lib/status.ts";
import { Icon } from "./Icons.tsx";
import { NewAction, SearchPalette } from "./forms.tsx";

export type NavKey = "home" | "clients" | "properties" | "actions" | "meetings" | "email" | "import" | "settings";

const NAV: Array<{ key: NavKey; label: string; icon: IconName; href: string; group?: string }> = [
  { key: "home", label: "Home", icon: "home", href: "/" },
  { key: "clients", label: "Clients", icon: "users", href: "/clients" },
  { key: "properties", label: "Properties", icon: "building", href: "/properties" },
  { key: "actions", label: "Actions", icon: "list", href: "/commitments", group: "Follow-through" },
  { key: "meetings", label: "Meetings", icon: "cal", href: "/meetings" },
  { key: "email", label: "Email Centre", icon: "mail", href: "/emails" },
];

const ADMIN: Array<{ key: NavKey; label: string; icon: IconName; href: string }> = [
  { key: "import", label: "Import Excel", icon: "upload", href: "/import" },
  { key: "settings", label: "Settings", icon: "cog", href: "/settings" },
];

/** App shell from the approved mockup. Every page renders per request because status depends on today's London date. */
export async function Shell({ active, children }: { active: NavKey; children: React.ReactNode }) {
  await connection();
  const today = todayLondon();
  const urgentCount = buildHome(await getCommandData(today), today).urgent.length;

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
        {ADMIN.map((item) => (
          <Link key={item.key} className={`nav-item${item.key === active ? " active" : ""}`} href={item.href}><Icon name={item.icon} />{item.label}</Link>
        ))}
        <div className="foot">
          <div className="m365"><span className="dot off" />Microsoft 365 not connected</div>
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <SearchPalette />
          <span className="demo">Demo data</span>
          <div className="spacer" />
          <NewAction text={<><Icon name="plus" />Quick capture</>} />
          <div className="avatar">TO</div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
