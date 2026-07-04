/**
 * Apple Push Notification service (APNs) sender for the Capacitor-wrapped
 * iOS app. Separate from lib/push.ts's Web Push (VAPID) path — a WKWebView
 * never gets the browser Push API, so notifications in the native app can
 * only arrive via a real device token registered through
 * @capacitor/push-notifications and delivered here.
 *
 * No extra npm dependency: the provider auth token is a small ES256 JWT,
 * which Node's own `crypto` can sign (with `dsaEncoding: "ieee-p1363"` for
 * the raw r||s format JWT requires), and the request itself is plain
 * HTTP/2 via Node's core `http2` module — exactly what APNs requires.
 *
 * NOTE: this targets production APNs (api.push.apple.com), which is what
 * TestFlight and App Store builds use (distribution-signed). A debug build
 * run straight from Xcode with a development profile would need
 * api.sandbox.push.apple.com instead — not needed for this project's
 * no-local-Mac CI-only workflow, but worth knowing if that ever changes.
 */
import crypto from "node:crypto";
import http2 from "node:http2";

const APNS_HOST = "https://api.push.apple.com";
/** Apple recommends reusing a provider token for under an hour. */
const TOKEN_LIFETIME_SECONDS = 55 * 60;

let cachedToken: { jwt: string; issuedAt: number } | null = null;

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** .p8 keys are often stored in env as a single line with literal "\n"s. */
function getSigningKey(): string {
  const raw = process.env.APNS_KEY_P8;
  if (!raw) throw new Error("APNS_KEY_P8 not set");
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function getProviderToken(): string {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  if (!keyId || !teamId) throw new Error("APNS_KEY_ID / APNS_TEAM_ID not set");

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now - cachedToken.issuedAt < TOKEN_LIFETIME_SECONDS) {
    return cachedToken.jwt;
  }

  const header = base64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const claims = base64url(JSON.stringify({ iss: teamId, iat: now }));
  const signingInput = `${header}.${claims}`;

  const signature = crypto.sign("SHA256", Buffer.from(signingInput), {
    key: getSigningKey(),
    dsaEncoding: "ieee-p1363",
  });

  const jwt = `${signingInput}.${base64url(signature)}`;
  cachedToken = { jwt, issuedAt: now };
  return jwt;
}

export type ApnsPayload = { title: string; body?: string; url: string };
export type ApnsResult = { ok: boolean; shouldRemove: boolean };

/** Send one push to one device token. Never throws — caller just checks the result. */
export async function sendApnsToDevice(
  deviceToken: string,
  payload: ApnsPayload
): Promise<ApnsResult> {
  const topic = process.env.APNS_TOPIC;
  if (!topic || !process.env.APNS_KEY_P8) return { ok: false, shouldRemove: false };

  let jwt: string;
  try {
    jwt = getProviderToken();
  } catch {
    return { ok: false, shouldRemove: false };
  }

  const body = JSON.stringify({
    aps: { alert: { title: payload.title, body: payload.body ?? "" }, sound: "default" },
    url: payload.url,
  });

  return new Promise((resolve) => {
    let client: http2.ClientHttp2Session;
    try {
      client = http2.connect(APNS_HOST);
    } catch {
      resolve({ ok: false, shouldRemove: false });
      return;
    }
    client.on("error", () => resolve({ ok: false, shouldRemove: false }));

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": topic,
      "apns-push-type": "alert",
      "content-type": "application/json",
    });

    let status = 0;
    let data = "";
    req.setEncoding("utf8");
    req.on("response", (headers) => {
      status = Number(headers[":status"]) || 0;
    });
    req.on("data", (chunk: string) => {
      data += chunk;
    });
    req.on("end", () => {
      client.close();
      // 410 = token expired; 400 BadDeviceToken = never valid / wrong environment.
      const shouldRemove = status === 410 || (status === 400 && data.includes("BadDeviceToken"));
      resolve({ ok: status === 200, shouldRemove });
    });
    req.on("error", () => {
      client.close();
      resolve({ ok: false, shouldRemove: false });
    });
    req.write(body);
    req.end();
  });
}
