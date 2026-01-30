import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_COST_FACTOR = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Timing-safe comparison of two strings
 * Used for API key comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = new Uint8Array(Buffer.from(a));
  const bufB = new Uint8Array(Buffer.from(b));

  if (bufA.length !== bufB.length) {
    // Still do a comparison to maintain constant time
    const dummy = new Uint8Array(bufA.length);
    crypto.timingSafeEqual(bufA, dummy);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate a random string for secrets (session secret, API keys)
 * Run this in Node REPL: require('./src/lib/auth').generateSecret(32)
 */
export function generateSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}
