/**
 * Generate Sign in with Apple client secret (JWT) for use with Auth.js Apple provider.
 * Apple requires a JWT signed with ES256; the object form in some NextAuth versions fails at runtime.
 */

import crypto from "crypto";

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function getAppleClientSecret(): string | null {
  const clientId = process.env.APPLE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  // Support env stored as one line with \n or as multi-line
  const raw = process.env.APPLE_PRIVATE_KEY ?? "";
  const privateKeyPem = raw.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();

  if (!clientId || !teamId || !keyId || !privateKeyPem) return null;

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "ES256", kid: keyId };
    const payload = {
      iss: teamId,
      iat: now,
      exp: now + 3600,
      aud: "https://appleid.apple.com",
      sub: clientId,
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    const key = crypto.createPrivateKey({
      key: privateKeyPem,
      format: "pem",
    });
    const sign = crypto.createSign("SHA256");
    sign.update(signingInput);
    sign.end();
    // IEEE P1363 = raw R||S (64 bytes for P-256), which is what JWT ES256 expects
    const signature = sign.sign({ key, dsaEncoding: "ieee-p1363" });

    const sigB64 = base64UrlEncode(signature);
    return `${signingInput}.${sigB64}`;
  } catch {
    return null;
  }
}
