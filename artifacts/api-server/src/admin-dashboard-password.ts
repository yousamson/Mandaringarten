import type { Request, Response } from "express";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, adminDashboardCredentialsTable, adminDashboardSessionsTable } from "@workspace/db";
import { createAdminDashboardSessionToken, hashAdminDashboardSessionToken } from "./admin-dashboard-password-crypto";

const PASSWORD_COOKIE = "mg_admin_dashboard";
const PASSWORD_SESSION_MS = 8 * 60 * 60 * 1000;
const PASSWORD_SESSION_PATH = "/api/admin/dashboard";

export type AdminDashboardCredential = typeof adminDashboardCredentialsTable.$inferSelect;
type PasswordSessionStatus = { passwordConfigured: boolean; passwordAuthenticated: boolean };

function readCookie(req: Request): string | null {
  const prefix = `${PASSWORD_COOKIE}=`;
  const value = req.get("cookie")?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
  return value && /^[a-f0-9]{64}$/i.test(value) ? value : null;
}

function setPasswordCookie(res: Response, token: string, maxAgeSeconds: number): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${PASSWORD_COOKIE}=${token}; Path=${PASSWORD_SESSION_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`,
  );
}

export function clearAdminDashboardPasswordCookie(res: Response): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${PASSWORD_COOKIE}=; Path=${PASSWORD_SESSION_PATH}; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  );
}

export async function getAdminDashboardCredential(): Promise<AdminDashboardCredential | undefined> {
  const [credential] = await db.select().from(adminDashboardCredentialsTable)
    .where(eq(adminDashboardCredentialsTable.id, 1)).limit(1);
  return credential;
}

export async function getAdminDashboardPasswordStatus(
  userId: string,
  req: Request,
  credential?: AdminDashboardCredential,
): Promise<PasswordSessionStatus> {
  const passwordCredential = credential ?? await getAdminDashboardCredential();
  if (!passwordCredential) {
    return { passwordConfigured: false, passwordAuthenticated: false };
  }

  const token = readCookie(req);
  if (!token) {
    return { passwordConfigured: true, passwordAuthenticated: false };
  }

  const tokenHash = hashAdminDashboardSessionToken(token);
  const [session] = await db.select().from(adminDashboardSessionsTable)
    .where(eq(adminDashboardSessionsTable.tokenHash, tokenHash)).limit(1);
  const valid = Boolean(
    session &&
    session.clerkUserId === userId &&
    session.passwordVersion === passwordCredential.passwordVersion &&
    session.expiresAt.getTime() > Date.now(),
  );
  if (!valid && session) {
    await db.delete(adminDashboardSessionsTable)
      .where(eq(adminDashboardSessionsTable.tokenHash, tokenHash));
  }
  return { passwordConfigured: true, passwordAuthenticated: valid };
}

export async function requireAdminDashboardPasswordSession(
  userId: string,
  req: Request,
  res: Response,
): Promise<boolean> {
  const status = await getAdminDashboardPasswordStatus(userId, req);
  res.setHeader("Cache-Control", "private, no-store");
  if (!status.passwordConfigured) {
    res.status(428).json({ error: "Set the administrator dashboard password first." });
    return false;
  }
  if (!status.passwordAuthenticated) {
    res.status(423).json({ error: "Enter the administrator dashboard password to continue." });
    return false;
  }
  return true;
}

export async function createAdminDashboardPasswordSession(
  userId: string,
  credential: AdminDashboardCredential,
  res: Response,
): Promise<void> {
  const token = createAdminDashboardSessionToken();
  const expiresAt = new Date(Date.now() + PASSWORD_SESSION_MS);
  await db.delete(adminDashboardSessionsTable).where(and(
    eq(adminDashboardSessionsTable.clerkUserId, userId),
    lt(adminDashboardSessionsTable.expiresAt, new Date()),
  ));
  await db.insert(adminDashboardSessionsTable).values({
    tokenHash: hashAdminDashboardSessionToken(token),
    clerkUserId: userId,
    passwordVersion: credential.passwordVersion,
    expiresAt,
  });
  setPasswordCookie(res, token, Math.floor(PASSWORD_SESSION_MS / 1000));
}

export async function deleteAdminDashboardPasswordSession(req: Request, userId: string): Promise<void> {
  const token = readCookie(req);
  if (!token) return;
  await db.delete(adminDashboardSessionsTable).where(and(
    eq(adminDashboardSessionsTable.tokenHash, hashAdminDashboardSessionToken(token)),
    eq(adminDashboardSessionsTable.clerkUserId, userId),
  ));
}

export async function registerFailedAdminDashboardPasswordAttempt(
  credential: AdminDashboardCredential,
): Promise<void> {
  const attempts = sql<number>`
    case
      when ${adminDashboardCredentialsTable.lockedUntil} is not null
        and ${adminDashboardCredentialsTable.lockedUntil} <= now()
      then 1
      else ${adminDashboardCredentialsTable.failedAttempts} + 1
    end
  `;
  await db.update(adminDashboardCredentialsTable).set({
    failedAttempts: attempts,
    lockedUntil: sql`
      case when ${attempts} >= 5
        then now() + interval '15 minutes'
        else null
      end
    `,
  }).where(and(
    eq(adminDashboardCredentialsTable.id, 1),
    eq(adminDashboardCredentialsTable.passwordVersion, credential.passwordVersion),
  ));
}

export async function revokeAdminDashboardPasswordSessions(): Promise<void> {
  await db.delete(adminDashboardSessionsTable);
}
