"use client";

import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./ConvexClientProvider.tsx";

/** Calls a Convex mutation by name ("module:function"), then refreshes the server-rendered page. */
export function useAct(name: string) {
  const run = useMutation(makeFunctionReference<"mutation">(name));
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function act(args: Record<string, unknown>, done?: string) {
    setBusy(true);
    try {
      const result = await run(args);
      if (done) toast(done);
      router.refresh();
      return result;
    } catch (e) {
      toast(e instanceof Error ? e.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0] : "Something went wrong");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  return { act, busy };
}

export function Act({ fn, args, label, done, className = "btn btn-ghost btn-sm", confirm }: {
  fn: string; args: Record<string, unknown>; label: React.ReactNode; done?: string; className?: string; confirm?: string;
}) {
  const { act, busy } = useAct(fn);
  return (
    <button className={className} disabled={busy} onClick={() => { if (!confirm || window.confirm(confirm)) act(args, done).catch(() => {}); }}>
      {label}
    </button>
  );
}
