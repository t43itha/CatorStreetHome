import { Shell } from "@/components/Shell.tsx";
import { EmailCentre } from "@/components/EmailCentre.tsx";
import { api, read } from "@/lib/data.ts";

export default async function EmailCentrePage() {
  const { drafts, sent, threads } = await read(api.views.emailCentre, {});
  return (
    <Shell active="email">
      <EmailCentre drafts={drafts} sent={sent} threads={threads} />
    </Shell>
  );
}
