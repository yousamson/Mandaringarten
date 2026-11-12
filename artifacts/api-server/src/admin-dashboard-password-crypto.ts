import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

function derivePasswordHash(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashAdminDashboardPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derivePasswordHash(password, salt);
  return { passwordSalt: salt.toString("hex"), passwordHash: hash.toString("hex") };
}

export async function verifyAdminDashboardPassword(
  password: string,
  passwordSalt: string,
  expectedHash: string,
): Promise<boolean> {
  const salt = Buffer.from(passwordSalt, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = await derivePasswordHash(password, salt);
  return timingSafeEqual(actual, expected);
}

export function createAdminDashboardSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashAdminDashboardSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
