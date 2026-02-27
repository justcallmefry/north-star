/**
 * Email env for magic-link send. Set by the auth API route (where process.env is available)
 * and read by the email chunk. Uses globalThis so it works across async boundaries and
 * chunks in the same serverless invocation.
 */
export type EmailEnv = { resendApiKey?: string; emailServer?: string; nodeEnv?: string };

const GLOBAL_KEY = "__NORTH_STAR_EMAIL_ENV";

function getGlobal(): Record<string, EmailEnv> {
  if (typeof globalThis === "undefined") return {};
  const g = globalThis as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = {};
  return g[GLOBAL_KEY] as Record<string, EmailEnv>;
}

export function setEmailEnv(env: EmailEnv): void {
  getGlobal()[""] = env;
}

export function getEmailEnv(): EmailEnv {
  return getGlobal()[""] ?? {};
}

export async function runWithEmailEnvAsync<T>(env: EmailEnv, fn: () => Promise<T>): Promise<T> {
  setEmailEnv(env);
  try {
    return await fn();
  } finally {
    setEmailEnv({});
  }
}
