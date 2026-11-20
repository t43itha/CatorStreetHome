import { Shell } from "@/components/Shell.tsx";
import { SettingsForm } from "@/components/SettingsForm.tsx";
import { UsersAdmin } from "@/components/UsersAdmin.tsx";
import { api, read } from "@/lib/data.ts";

/** Owner only (plan §8.3). Staff see a short note; the server rejects their writes anyway. */
export default async function SettingsPage() {
  const me = await read(api.users.me, {});
  if (me?.role !== "owner") {
    return (
      <Shell active="settings">
        <div className="page-head"><div><span className="eyebrow">Admin</span><h1 className="page">Settings</h1><p className="lede">Settings are managed by the owner.</p></div></div>
      </Shell>
    );
  }
  const [initial, users] = await Promise.all([read(api.settings.get, {}), read(api.users.list, {})]);
  return (
    <Shell active="settings">
      <SettingsForm initial={initial} />
      <div style={{ marginTop: 20 }}><UsersAdmin users={users} meId={me._id} /></div>
    </Shell>
  );
}
