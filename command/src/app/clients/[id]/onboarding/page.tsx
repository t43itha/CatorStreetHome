import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell.tsx";
import { OnboardingFlow } from "@/components/OnboardingFlow.tsx";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api, readOrNull } from "@/lib/data.ts";
import { todayLondon } from "@/lib/status.ts";

export default async function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const progress = await readOrNull(api.onboarding.progress, { clientId: id as Id<"clients"> });
  if (!progress) notFound();
  return (
    <Shell active="clients">
      <div className="crumbs"><Link href="/clients">Clients</Link><span>/</span><Link href={`/clients/${id}`}>{progress.client.name}</Link><span>/</span><span>Onboarding</span></div>
      <OnboardingFlow p={progress} today={todayLondon()} />
    </Shell>
  );
}
