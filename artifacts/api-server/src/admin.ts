import { clerkClient } from "@clerk/express";

type ClerkEmailAddress = {
  emailAddress: string;
  verification?: { status?: string | null } | null;
};

export function hasVerifiedAdministratorEmail(
  emailAddresses: ClerkEmailAddress[],
  allowed: ReadonlySet<string>,
): boolean {
  return emailAddresses.some((email) =>
    email.verification?.status === "verified" &&
    allowed.has(email.emailAddress.trim().toLowerCase()));
}

export async function isAdministrator(userId: string): Promise<boolean> {
  const allowed = new Set((process.env.MANDARIN_ADMIN_EMAILS ?? "").split(",")
    .map((email) => email.trim().toLowerCase()).filter(Boolean));
  if (!allowed.size) return false;
  // Never authorize using client input, an unverified email, or editable user metadata.
  const user = await clerkClient.users.getUser(userId);
  // The designated, verified admin address may be secondary in Clerk. Require
  // verified ownership, but do not make the primary-address setting an access gate.
  return hasVerifiedAdministratorEmail(user.emailAddresses, allowed);
}
