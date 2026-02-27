"use server";

import { signIn } from "@/lib/auth";

/**
 * Auth.js–recommended credentials sign-in via server action.
 * signIn() sets the session cookie and redirects; the client receives the redirect response with Set-Cookie.
 */
export async function signInCredentials(formData: FormData) {
  await signIn("credentials", formData);
}
