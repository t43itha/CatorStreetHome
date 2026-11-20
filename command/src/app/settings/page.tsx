import { Shell } from "@/components/Shell.tsx";
import { SettingsForm } from "@/components/SettingsForm.tsx";
import { api, read } from "@/lib/data.ts";

export default async function SettingsPage() {
  const initial = await read(api.settings.get, {});
  return <Shell active="settings"><SettingsForm initial={initial} /></Shell>;
}
