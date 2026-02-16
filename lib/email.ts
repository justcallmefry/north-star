/**
 * Sends the magic link email for Auth.js v5 Nodemailer provider.
 * Uses EMAIL_SERVER (SMTP) or RESEND_API_KEY when available.
 */
export async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
  provider: { server?: string | object; from?: string };
  token?: string;
  expires?: Date;
}): Promise<void> {
  const { identifier, url, provider } = params;
  const { server, from } = provider;

  if (process.env.RESEND_API_KEY) {
    await sendWithResend(identifier, url, from ?? "noreply@example.com");
    return;
  }

  // In development with no Resend: log the link so you can sign in without SMTP
  if (process.env.NODE_ENV === "development") {
    console.log(`[Magic link] ${identifier} -> ${url}`);
    return;
  }

  if (server) {
    await sendWithNodemailer(identifier, url, server, from ?? "noreply@example.com");
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

async function sendWithResend(to: string, url: string, from: string): Promise<void> {
  const resend = await import("resend");
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const client = new resend.Resend(apiKey);
  const { error } = await client.emails.send({
    from: from || "onboarding@resend.dev",
    to: [to],
    subject: "Sign in to North Star",
    html: `<p>Sign in to North Star:</p><p><a href="${url}">Sign in</a></p><p>Or copy: ${url}</p>`,
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}
