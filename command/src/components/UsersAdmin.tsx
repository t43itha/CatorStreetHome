"use client";

import { useState } from "react";
import { useAct } from "./Act.tsx";

export interface UserRow { _id: string; email: string; name?: string; role: "owner" | "staff"; status: "invited" | "active" | "disabled"; lastSeenAt?: number }

/** Settings → Users (plan §8.3): invite, change role, disable or re-enable. Owner only; the server enforces it. */
export function UsersAdmin({ users, meId }: { users: UserRow[]; meId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "owner">("staff");
  const invite = useAct("users:invite");
  const setUserRole = useAct("users:setRole");
  const setStatus = useAct("users:setStatus");
  return (
    <div className="card">
      <div className="card-head"><div><h2 className="card-title">Users</h2><div className="sub">Who can sign in. They must also be assigned to the Command app in Entra.</div></div></div>
      <div className="scroll-x"><table className="wtable">
        <thead><tr><th>Person</th><th>Role</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td><b>{u.name ?? u.email}</b>{u.name && <><br /><small>{u.email}</small></>}</td>
              <td>
                <select value={u.role} disabled={setUserRole.busy} onChange={(e) => setUserRole.act({ id: u._id, role: e.target.value }, "Role changed").catch(() => {})} aria-label={`Role for ${u.email}`}>
                  <option value="staff">Staff</option><option value="owner">Owner</option>
                </select>
              </td>
              <td><span className={`pill ${u.status === "active" ? "current" : u.status === "invited" ? "soon" : "na"}`}>{u.status[0].toUpperCase() + u.status.slice(1)}</span></td>
              <td>
                {u._id !== meId && u.status === "active" && <button className="btn btn-ghost btn-sm" disabled={setStatus.busy} onClick={() => { if (confirm(`Disable ${u.email}? They are locked out on their next request.`)) setStatus.act({ id: u._id, status: "disabled" }, "Disabled").catch(() => {}); }}>Disable</button>}
                {u.status === "disabled" && <button className="btn btn-ghost btn-sm" disabled={setStatus.busy} onClick={() => setStatus.act({ id: u._id, status: "active" }, "Re-enabled").catch(() => {})}>Re-enable</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <form className="note" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }} onSubmit={(e) => { e.preventDefault(); invite.act({ email, role }, `Invited ${email}`).then(() => setEmail("")).catch(() => {}); }}>
        <div className="form-row" style={{ flex: "1 1 220px" }}><label>Invite by work email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label></div>
        <div className="form-row"><label>Role<select value={role} onChange={(e) => setRole(e.target.value as "staff" | "owner")}><option value="staff">Staff</option><option value="owner">Owner</option></select></label></div>
        <button className="btn btn-primary" disabled={invite.busy}>Invite</button>
      </form>
    </div>
  );
}
