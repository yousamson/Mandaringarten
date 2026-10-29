import { clerkClient } from "@clerk/express";

export async function isAdministrator(userId: string): Promise<boolean> {
  const allowed = new Set((process.env.MANDARIN_ADMIN_EMAILS ?? "").split(",")
    .map((email) => email.trim().toLowerCase()).filter(Boolean));
  if (!allowed.size) return false;
  // Never authorize using client input, an unverified email, or editable user metadata.
  const user = await clerkClient.users.getUser(userId);
  const primary = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
  return primary?.verification?.status === "verified" &&
    allowed.has(primary.emailAddress.toLowerCase());
}
