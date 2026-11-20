"use client";

import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useConvexAuth, useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { useEffect, useState } from "react";
import { authConfigured, SCOPES } from "@/lib/auth.ts";
import { clearTokenCookie } from "./ConvexClientProvider.tsx";

const claimRef = makeFunctionReference<"mutation">("users:claim");

/** The only thing anyone sees until they hold an active invite (plan §8.1). */
export function SignIn() {
  const { instance, accounts, inProgress } = useMsal();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const claim = useMutation(claimRef);
  const [state, setState] = useState<"idle" | "checking" | "denied">("idle");
  const account = accounts[0];

  useEffect(() => {
    if (!isAuthenticated || state !== "idle") return;
    setState("checking");
    claim({}).then(() => window.location.replace("/")).catch(() => setState("denied"));
  }, [isAuthenticated, state, claim]);

  return (
    <main style={{ maxWidth: 440, margin: "12vh auto", padding: "0 16px", textAlign: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cator-logo.png" alt="Cator Street" style={{ height: 56 }} />
      <h1 className="page" style={{ fontSize: 32 }}>Command</h1>
      {!authConfigured ? (
        <p className="lede">Sign-in isn&apos;t configured. Set <code>NEXT_PUBLIC_ENTRA_TENANT_ID</code> and <code>NEXT_PUBLIC_ENTRA_CLIENT_ID</code> here, and <code>ENTRA_TENANT_ID</code> / <code>ENTRA_CLIENT_ID</code> on the Convex deployment.</p>
      ) : state === "denied" ? (
        <>
          <p className="lede">{account?.username ?? "This account"} doesn&apos;t have access. Ask the owner to invite this email address.</p>
          <p style={{ marginTop: 16 }}><button className="btn btn-ghost" onClick={() => { clearTokenCookie(); instance.logoutRedirect(); }}>Sign out</button></p>
        </>
      ) : account || isLoading || inProgress !== InteractionStatus.None ? (
        <p className="lede">Signing you in…</p>
      ) : (
        <>
          <p className="lede">Private to Cator Street Property Services.</p>
          <p style={{ marginTop: 20 }}><button className="btn btn-primary" onClick={() => instance.loginRedirect({ scopes: SCOPES })}>Sign in with Microsoft</button></p>
        </>
      )}
    </main>
  );
}
