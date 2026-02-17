/** Optional env passed from auth so email bundle doesn't rely on process.env (Vercel inlining). */
export type EmailEnv = { resendApiKey?: string; emailServer?: string; nodeEnv?: string };

/**
 * Sends the magic link email for Auth.js v5 Nodemailer provider.
 * Uses options (from auth) or EMAIL_SERVER / RESEND_API_KEY when available.
 */
export async function sendVerificationRequest(
  params: {
    identifier: string;
    url: string;
    provider: { server?: string | object; from?: string };
    token?: string;
    expires?: Date;
  },
  options?: EmailEnv
): Promise<void> {
  const { identifier, url, provider } = params;
  const { server, from } = provider;
  const resendKey = options?.resendApiKey ?? process.env["RESEND_API_KEY"];
  const smtpServer = options?.emailServer ?? process.env["EMAIL_SERVER"];
  const nodeEnv = options?.nodeEnv ?? process.env["NODE_ENV"];

  if (resendKey) {
    await sendWithResend(identifier, url, from ?? "noreply@example.com", resendKey);
    return;
  }

  if (nodeEnv === "development") {
    console.log(`[Magic link] ${identifier} -> ${url}`);
    return;
  }

  const serverToUse = smtpServer ?? server;
  if (serverToUse) {
    await sendWithNodemailer(identifier, url, serverToUse, from ?? "noreply@example.com");
    return;
  }

  throw new Error("Email not configured: set EMAIL_SERVER or RESEND_API_KEY");
}

async function sendWithNodemailer(
  to: string,
  url: string,
  server: string | object,
  from: string
): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.default.createTransport(server);
  await transport.sendMail({
    to,
    from,
    subject: "Sign in to North Star",
    text: `Sign in here: ${url}`,
    html: `<p>Sign in to North Star:</p><p><a href="${url}">Sign in</a></p><p>Or copy: ${url}</p>`,
  });
}

async function sendWithResend(to: string, url: string, from: string, apiKey: string): Promise<void> {
  const resend = await import("resend");
  const client = new resend.Resend(apiKey);
  const { error } = await client.emails.send({
    from: from || "onboarding@resend.dev",
    to: [to],
    subject: "Sign in to North Star",
    html: `<p>Sign in to North Star:</p><p><a href="${url}">Sign in</a></p><p>Or copy: ${url}</p>`,
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

/** Called from the auth API route with process.env.RESEND_API_KEY so the key is read in the route chunk. */
export type VerificationRequestParams = {
  identifier: string;
  url: string;
  provider: { server?: string | object; from?: string };
  token?: string;
  expires?: Date;
};

export async function sendMagicLinkWithKey(
  params: VerificationRequestParams,
  apiKey: string | undefined
): Promise<void> {
  const { identifier, url, provider } = params;
  const from = provider.from ?? "noreply@example.com";
  if (apiKey) {
    await sendWithResend(identifier, url, from, apiKey);
    return;
  }
  if (process.env["NODE_ENV"] === "development") {
    console.log(`[Magic link] ${identifier} -> ${url}`);
    return;
  }
  throw new Error("Email is not configured. Set RESEND_API_KEY or EMAIL_SERVER in your deployment.");
}

/** Send beta signup confirmation with link to use the app. Returns true if sent, false if skipped (no config). */
export async function sendBetaConfirmation(to: string, appUrl: string): Promise<boolean> {
  const from = process.env["EMAIL_FROM"] || "onboarding@resend.dev";
  if (process.env["RESEND_API_KEY"]) {
    const resend = await import("resend");
    const client = new resend.Resend(process.env["RESEND_API_KEY"]);
    const signInUrl = `${appUrl}/login?email=${encodeURIComponent(to)}`;
    const { error } = await client.emails.send({
      from: from,
      to: [to],
      subject: "You're on the North Star beta list",
      html: `
        <p>You're on the list. We'll be in touch when a spot opens.</p>
        <p>You can also <a href="${signInUrl}">sign in now</a> to start using the app.</p>
        <p><a href="${signInUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#0f172a;color:white;text-decoration:none;border-radius:8px;">Sign in to North Star</a></p>
      `,
    });
    if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
    return true;
  }
  if (process.env["NODE_ENV"] === "development") {
    console.log(`[Beta confirmation] ${to} -> sign in at ${appUrl}/login`);
    return false;
  }
  if (process.env["EMAIL_SERVER"]) {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.default.createTransport(process.env["EMAIL_SERVER"]);
    const signInUrl = `${appUrl}/login`;
    await transport.sendMail({
      to,
      from: process.env["EMAIL_FROM"] ?? "noreply@example.com",
      subject: "You're on the North Star beta list",
      html: `<p>You're on the list.</p><p><a href="${signInUrl}">Sign in now</a> to start using the app.</p>`,
    });
    return true;
  }
  return false;
}
