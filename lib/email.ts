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

/** Send beta signup confirmation with link to use the app. */
export async function sendBetaConfirmation(to: string, appUrl: string): Promise<void> {
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  if (process.env.RESEND_API_KEY) {
    const resend = await import("resend");
    const client = new resend.Resend(process.env.RESEND_API_KEY);
    const signInUrl = `${appUrl}/login`;
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
    return;
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`[Beta confirmation] ${to} -> sign in at ${appUrl}/login`);
    return;
  }
  if (process.env.EMAIL_SERVER) {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.default.createTransport(process.env.EMAIL_SERVER);
    const signInUrl = `${appUrl}/login`;
    await transport.sendMail({
      to,
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
      subject: "You're on the North Star beta list",
      html: `<p>You're on the list.</p><p><a href="${signInUrl}">Sign in now</a> to start using the app.</p>`,
    });
    return;
  }
  // No email config: skip sending, don't fail signup
}
