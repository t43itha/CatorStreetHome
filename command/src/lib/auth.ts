// Browser sign-in settings (plan §8.2). Public values: the SPA app registration has no secret.
export const ENTRA_TENANT_ID = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID ?? "";
export const ENTRA_CLIENT_ID = process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID ?? "";
export const authConfigured = Boolean(ENTRA_TENANT_ID && ENTRA_CLIENT_ID);
export const SCOPES = ["openid", "profile", "email"];

/**
 * Server-rendered pages read Convex with the same Microsoft ID token, passed in this cookie.
 * It holds only the short-lived ID token, expires with it, and is never sent cross-site.
 */
export const TOKEN_COOKIE = "cmd_id_token";
