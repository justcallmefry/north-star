/**
 * Request-scoped email env. The API route sets this at the start of each request
 * (where process.env is available) so the email chunk can read it without relying on
 * process.env (which Next may inline at build time in other chunks).
 */
export type EmailEnv = { resendApiKey?: string; emailServer?: string; nodeEnv?: string };

let _env: EmailEnv = {};

export function setEmailEnv(env: EmailEnv): void {
  _env = env;
}

export function getEmailEnv(): EmailEnv {
  return _env;
}
