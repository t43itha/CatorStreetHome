"use client";

import { InteractionStatus, PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ENTRA_CLIENT_ID, ENTRA_TENANT_ID, SCOPES, TOKEN_COOKIE } from "@/lib/auth.ts";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const msal = new PublicClientApplication({
  auth: { clientId: ENTRA_CLIENT_ID || "not-configured", authority: `https://login.microsoftonline.com/${ENTRA_TENANT_ID || "common"}`, redirectUri: typeof window === "undefined" ? undefined : window.location.origin },
  cache: { cacheLocation: "localStorage" },
});

export function setTokenCookie(token: string, exp?: number) {
  const maxAge = exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 3000;
  document.cookie = `${TOKEN_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
}
export function clearTokenCookie() {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
}

/** Convex gets Microsoft's ID token from MSAL, refreshed silently; the cookie mirrors it for server rendering. */
function useAuthFromMsal() {
  const { instance, accounts, inProgress } = useMsal();
  const account = accounts[0];
  const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    if (!account) return null;
    try {
      const r = await instance.acquireTokenSilent({ scopes: SCOPES, account, forceRefresh: forceRefreshToken });
      setTokenCookie(r.idToken, (r.idTokenClaims as { exp?: number }).exp);
      return r.idToken;
    } catch {
      clearTokenCookie();
      return null;
    }
  }, [instance, account]);
  return useMemo(() => ({ isLoading: inProgress !== InteractionStatus.None, isAuthenticated: !!account, fetchAccessToken }), [inProgress, account, fetchAccessToken]);
}

const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((m: string) => {
    setMessage(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2600);
  }, []);
  return (
    <MsalProvider instance={msal}>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromMsal}>
        <ToastContext.Provider value={toast}>
          {children}
          <div className={`toast${message ? " show" : ""}`} role="status" aria-live="polite"><span>{message}</span></div>
        </ToastContext.Provider>
      </ConvexProviderWithAuth>
    </MsalProvider>
  );
}
