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

function buildMagicLinkHtml(to: string, url: string, logoUrl: string): string {
  const safeEmail = to.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
  <div style="margin:0;padding:32px 16px;background-color:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#e5e7eb;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:520px;margin:0 auto;">
      <tr>
        <td style="padding:20px 20px 16px 20px;text-align:left;">
          <div style="display:inline-block;padding:8px;border-radius:14px;background:#020617;border:1px solid rgba(30,64,175,0.6);box-shadow:0 18px 45px rgba(15,23,42,0.9);">
            <img src="${logoUrl}" alt="North Star" width="32" height="32" style="display:block;border:0;max-width:100%;" />
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 8px 20px;">
          <h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.3;font-weight:600;color:#f9fafb;">
            Welcome back to North Star
          </h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#cbd5f5;">
            We sent a one-time sign-in link for <strong style="color:#e5e7eb;">${safeEmail}</strong>. Your sign-in is private and secure.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 20px 8px 20px;">
          <a href="${url}"
             style="display:inline-block;padding:11px 22px;border-radius:10px;background:#22c55e;color:#022c22;font-size:14px;font-weight:600;text-decoration:none;text-align:center;box-shadow:0 10px 30px rgba(34,197,94,0.35);">
            Open North Star
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 20px 0 20px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;">
            If the button doesn&apos;t work, paste this link into your browser:
          </p>
          <p style="margin:6px 0 0 0;font-size:12px;line-height:1.5;color:#9ca3af;word-break:break-all;">
            ${url}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 20px 0 20px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
            One question a day. Your pace.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

function buildBetaWelcomeHtml(to: string, appUrl: string): { subject: string; html: string } {
  const safeEmail = to.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const signInUrl = `${appUrl}/login?email=${encodeURIComponent(to)}`;
  const logoUrl = `${appUrl.replace(/\/$/, "")}/north-star-logo.png`;
  const subject = "Welcome to the North Star beta";
  const html = `
  <div style="margin:0;padding:32px 16px;background-color:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#e5e7eb;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:520px;margin:0 auto;">
      <tr>
        <td style="padding:20px 20px 16px 20px;text-align:left;">
          <div style="display:inline-block;padding:8px;border-radius:14px;background:#020617;border:1px solid rgba(30,64,175,0.6);box-shadow:0 18px 45px rgba(15,23,42,0.9);">
            <img src="${logoUrl}" alt="North Star" width="32" height="32" style="display:block;border:0;max-width:100%;" />
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 8px 20px;">
          <h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.3;font-weight:600;color:#f9fafb;">
            You&apos;re in the North Star beta
          </h1>
          <p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:#cbd5f5;">
            Thanks for joining us. North Star is a simple way to stay in sync—one question a day.
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;">
            This invite was sent to <strong style="color:#e5e7eb;">${safeEmail}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 20px 8px 20px;">
          <a href="${signInUrl}"
             style="display:inline-block;padding:11px 22px;border-radius:10px;background:#22c55e;color:#022c22;font-size:14px;font-weight:600;text-decoration:none;text-align:center;box-shadow:0 10px 30px rgba(34,197,94,0.35);">
            Sign in and answer today's question
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 20px 0 20px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;">
            If the button doesn&apos;t work, paste this link into your browser:
          </p>
          <p style="margin:6px 0 0 0;font-size:12px;line-height:1.5;color:#9ca3af;word-break:break-all;">
            ${signInUrl}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 20px 0 20px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
            One question a day. Answer privately, reveal together when you&apos;re both ready.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
  return { subject, html };
}

async function sendWithNodemailer(
  to: string,
  url: string,
  server: string | object,
  from: string
): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.default.createTransport(server);
  const origin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return "";
    }
  })();
  const logoUrl = origin ? `${origin}/north-star-logo.png` : "";
  await transport.sendMail({
    to,
    from,
    subject: "Sign in to North Star",
    text: `Sign in here: ${url}`,
    html: buildMagicLinkHtml(to, url, logoUrl || url),
  });
}

async function sendWithResend(to: string, url: string, from: string, apiKey: string): Promise<void> {
  const resend = await import("resend");
  const client = new resend.Resend(apiKey);
  const origin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return "";
    }
  })();
  const logoUrl = origin ? `${origin}/north-star-logo.png` : "";
  const { error } = await client.emails.send({
    from: from || "onboarding@resend.dev",
    to: [to],
    subject: "Sign in to North Star",
    html: buildMagicLinkHtml(to, url, logoUrl || url),
  });
  if (error) {
    const msg = typeof error === "object" && error !== null && "message" in error ? String((error as { message?: string }).message) : JSON.stringify(error);
    const isDomainRestriction =
      (typeof error === "object" && error !== null && "statusCode" in error && (error as { statusCode?: number }).statusCode === 403) ||
      /verify a domain|only send.*your own email/i.test(msg);
    if (isDomainRestriction) {
      throw new Error(
        "RESEND_DOMAIN_REQUIRED: To send sign-in links to other people, verify a domain at resend.com/domains and set EMAIL_FROM to an address on that domain."
      );
    }
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
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
    const { subject, html } = buildBetaWelcomeHtml(to, appUrl);
    const { error } = await client.emails.send({
      from,
      to: [to],
      subject,
      html,
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
    const { subject, html } = buildBetaWelcomeHtml(to, appUrl);
    await transport.sendMail({
      to,
      from: process.env["EMAIL_FROM"] ?? "noreply@example.com",
      subject,
      html,
    });
    return true;
  }
  return false;
}
