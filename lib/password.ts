import crypto from "crypto";

const SALT_BYTES = 16;
const KEY_LEN = 64;

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(SALT_BYTES);
  const hash = crypto.scryptSync(plain, salt, KEY_LEN);
  return `${salt.toString("base64")}.${hash.toString("base64")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltB64, hashB64] = stored.split(".");
  if (!saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, "base64");
  const hash = crypto.scryptSync(plain, salt, KEY_LEN);
  const expected = Buffer.from(hashB64, "base64");
  return crypto.timingSafeEqual(hash, expected);
}
