import Link from "next/link";
import { Shell } from "@/components/Shell.tsx";
import { Icon } from "@/components/Icons.tsx";
import { NewMeeting } from "@/components/NewMeeting.tsx";
import { api, read } from "@/lib/data.ts";
import { todayLondon } from "@/lib/status.ts";

export default async function MeetingsPage() {
  const today = todayLondon();
  const [meetings, clients] = await Promise.all([read(api.views.meetings, {}), read(api.views.clients, { today })]);
  const upcoming = meetings.filter((m) => m.scheduledAt.slice(0, 10) >= today).reverse();
  const past = meetings.filter((m) => m.scheduledAt.slice(0, 10) < today);
  const Section = ({ title, list }: { title: string; list: typeof meetings }) => (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-head"><div><h2 className="card-title">{title}</h2></div></div>
      {list.length === 0 && <div className="empty">None.</div>}
      {list.map((m) => (
        <Link className="meeting" key={m._id} href={`/meetings/${m._id}`}>
          <div className="time">{m.scheduledAt.slice(11, 16)}</div>
          <div><div className="t">{m.title}</div><div className="s">{m.scheduledAt.slice(0, 10).split("-").reverse().join("/")} · {m.context}</div>{m.teamsLabel && <span className="teams"><Icon name="chat" style={{ width: 12, height: 12 }} />{m.teamsLabel}</span>}</div>
        </Link>
      ))}
    </div>
  );
  return (
    <Shell active="meetings">
      <div className="page-head">
        <div><span className="eyebrow">Meetings</span><h1 className="page">Meetings</h1><p className="lede">Notes, decisions and the actions each meeting created.</p></div>
        <NewMeeting clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
      <Section title="Today and upcoming" list={upcoming} />
      <Section title="Past" list={past} />
    </Shell>
  );
}
