import { AsyncLocalStorage } from "async_hooks";

/**
 * Request-scoped email env. The API route runs the handler inside runWithEmailEnvAsync()
 * so getEmailEnv() sees the env in the same async context (avoids process.env inlined empty in other chunks).
 */
export type EmailEnv = { resendApiKey?: string; emailServer?: string; nodeEnv?: string };

const storage = new AsyncLocalStorage<EmailEnv>();

export async function runWithEmailEnvAsync<T>(env: EmailEnv, fn: () => Promise<T>): Promise<T> {
  return storage.run(env, fn);
}

export function getEmailEnv(): EmailEnv {
  return storage.getStore() ?? {};
}
