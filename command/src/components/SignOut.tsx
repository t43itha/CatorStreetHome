"use client";

import { useMsal } from "@azure/msal-react";
import { clearTokenCookie } from "./ConvexClientProvider.tsx";

export function SignOut({ initials, name }: { initials: string; name: string }) {
  const { instance } = useMsal();
  return (
    <button className="avatar" title={`${name} · sign out`} aria-label={`Signed in as ${name}. Sign out`} onClick={() => { clearTokenCookie(); instance.logoutRedirect(); }}>
      {initials}
    </button>
  );
}
