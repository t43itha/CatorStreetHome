import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell.tsx";
import { Icon } from "@/components/Icons.tsx";
import { MeetingWorkspace } from "@/components/MeetingWorkspace.tsx";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api, read } from "@/lib/data.ts";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await read(api.views.meeting, { id: id as Id<"meetings"> }).catch(() => null);
  if (!data) notFound();
  const { meeting: m, client, actions } = data;
  return (
    <Shell active="meetings">
      <div className="crumbs"><Link href="/meetings">Meetings</Link><span>/</span><span>{m.title}</span></div>
      <div className="page-head">
        <div>
          <h1 className="page" style={{ marginTop: 0 }}>{m.title}</h1>
          <div className="contact">
            <span><Icon name="cal" />{m.scheduledAt.slice(0, 10).split("-").reverse().join("/")} · {m.scheduledAt.slice(11, 16)}</span>
            {m.teamsLabel && <span><Icon name="chat" />Microsoft Teams</span>}
            {m.context && <span><Icon name="building" />{m.context}</span>}
            {client && <Link href={`/clients/${client._id}`}><Icon name="users" />{client.name}</Link>}
          </div>
        </div>
        <span className="tag green">{actions.length} actions tracked</span>
      </div>
      <MeetingWorkspace id={m._id} notes={m.notes ?? ""} decisions={m.decisions ?? []} actions={actions} />
    </Shell>
  );
}
