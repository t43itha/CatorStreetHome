"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAct } from "./Act.tsx";
import { Dialog } from "./Dialog.tsx";
import { Icon } from "./Icons.tsx";

export function NewMeeting({ clients }: { clients: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", date: "", time: "10:00", clientId: "", context: "" });
  const { act, busy } = useAct("meetings:create");
  const router = useRouter();
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><Icon name="plus" />Log meeting</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Log a meeting">
        <form style={{ display: "contents" }} onSubmit={(e) => {
          e.preventDefault();
          const args: Record<string, unknown> = { title: f.title, scheduledAt: `${f.date}T${f.time}`, context: f.context };
          if (f.clientId) args.clientId = f.clientId;
          act(args, "Meeting logged").then((id) => { setOpen(false); router.push(`/meetings/${id}`); }).catch(() => {});
        }}>
          <div className="form-row"><label>Title<input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label></div>
          <div className="form-grid">
            <div className="form-row"><label>Date<input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label></div>
            <div className="form-row"><label>Time<input type="time" required value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></label></div>
          </div>
          <div className="form-row"><label>Client<select value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}><option value="">None</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
          <div className="form-row"><label>Context<input value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })} placeholder="Property or purpose" /></label></div>
          <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Save</button></div>
        </form>
      </Dialog>
    </>
  );
}
