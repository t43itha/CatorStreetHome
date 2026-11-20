// Microsoft Entra ID signs people in; Convex verifies the ID token on every call (plan §8.2, shape B).
// Entra's keys are not served at <issuer>/.well-known/jwks.json, so the JWKS URL is explicit.
// The issuer contains the tenant ID, so tokens from any other Microsoft tenant are rejected.
export default {
  providers: [
    {
      type: "customJwt",
      issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
      jwks: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/discovery/v2.0/keys`,
      applicationID: process.env.ENTRA_CLIENT_ID, // must equal the ID token's aud
      algorithm: "RS256",
    },
  ],
};
