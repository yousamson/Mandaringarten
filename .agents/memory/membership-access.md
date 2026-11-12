---
name: Membership access and account controls
description: Paid membership activation, expiry restrictions, platform messages and account deletion requirements.
---

Registration includes acknowledging the monthly paid subscription; creating a login identity does not itself activate membership. A confirmed payment is required for ordinary member access. The verified administrator remains entitled without payment or renewal; all other non-renewed accounts must pay again before accessing member pages.

**Why:** the user requested「付費會員一旦未續訂閱，即被限制登入，並提供付費訂閱頁面，確認付費後才可登入，註冊同時確認付費訂閱才能成為會員」.

**How to apply:** authenticate the parent but keep ordinary lapsed accounts restricted to renewal, platform messages, deletion and legal information. The verified administrator is the sole no-charge, continuously entitled exception and must never be sent through checkout or subscription management. Billing needs an authenticated identity, and parents must not be trapped behind payment when seeking help or deleting data. Preserve public free material for signed-out visitors. Scheduled cancellation does not remove already-paid access before its end date.

Resolve the verified administrator entitlement before querying Stripe. The administrator is continuously premium without a Stripe subscription, so a billing-provider outage must not remove their access or team-inbox role.

**Why:** coupling admin recognition to Stripe status made complimentary access depend on an unrelated billing request.

**How to apply:** return active administrator access directly from the server-side verified-admin check; do not use client email matching as authorization.

Match the designated administrator against any verified email on the authenticated Clerk account, not only its primary email. Never grant admin access for an unverified address.

**Why:** a verified administrator address can be attached to the right account as a secondary address; making it primary-only incorrectly removes the complimentary membership and admin permissions.

**How to apply:** keep the server-side allowlist and verified-email requirement, but test every verified account email against it. Do not move this authorization decision to the mobile client.

Use `/account/access` to settle the membership identity; `/billing/status` supplies renewal and cancellation dates. Do not keep the membership label in a loading state while waiting for both responses.

**Why:** the account-access response can succeed while the separate billing-status query is delayed or disabled, otherwise members see “syncing” indefinitely despite a confirmed entitlement response.

**How to apply:** treat either a successful access response or a confirmed admin role as enough to display the member identity; render billing dates independently when available. If identity lookup stalls, stop the indefinite spinner after a short wait and provide a retry without guessing the account is free.

Parents contact the management team through platform messages. Only the server-authorized administrator can see the team inbox navigation and contents; other members can see only their own conversations. The administrator login email is never shown on the website or inbox.

**Why:** the user requested a platform messaging feature and designated an administrator account, then reiterated that the team inbox must be hidden from members and free pages. They did not authorize publishing the login email.

**How to apply:** gate administrator UI and inbox APIs using verified server-side administrator identity. Keep conversations private to their parent and authorized management. Do not expose the administrator login email in UI or legal contact details.

Administrator reporting may show member registration details only behind server-side administrator checks. Never return the administrator's own login email in the dashboard. Report daily registration counts, aggregate page-view totals (not unique visitors), and app-install-button clicks; do not store visitor IDs, account IDs, IP addresses, or page URLs in these dashboard metrics.

**Why:** the user requested administrator-only registration and traffic reports, chose page loads rather than unique visitors, and chose install-button clicks rather than confirmed PWA installations, while retaining the rule that the management login email never appears on the website.

**How to apply:** protect every reporting endpoint on the server, not only by hiding navigation; sanitize the designated administrator account before returning a user list; count events by Hong Kong calendar day; do not add identifying visitor-level tracking.

The administrator data dashboard requires both the verified Clerk administrator account and a separate administrator-set password. Store only a salted scrypt hash; issue a short-lived HttpOnly password-session cookie tied to the administrator, and revoke sessions when the password changes.

**Why:** the user explicitly chose an additional password rather than replacing the existing administrator account login.

**How to apply:** protect dashboard data APIs server-side with both checks; keep password setup/change restricted to the verified admin, limit repeated failed attempts, and never persist or log the plaintext password.

Parents may permanently delete their account, including when a subscription has expired. Require explicit confirmation of the current Privacy Policy and Disclaimer, irreversible data deletion, subscription cancellation/access ending and non-refundable paid subscription amounts. Keep the deletion-page acknowledgement aligned with the user's latest wording; do not restore removed exception wording unless requested.

**Why:** the user requested self-service deletion and explicitly requires policy and no-refund acknowledgements before deletion, then specifically asked to remove the legal-refund/error-charge exception from the deletion-page checkbox.

**How to apply:** require the deletion acknowledgements before accepting the request, then stop future billing, remove login/learning/messages, and clearly disclose unavoidable processor financial retention and minimal security records. Never claim that deleting the app account erases all third-party financial records.

Members who have accepted the current policy version must not be asked to repeat policy acknowledgements at every sign-in. Keep separate acknowledgements in registration, before checkout and before account deletion.

**Why:** the user explicitly said members do not need to reconfirm.

**How to apply:** use the saved account consent for existing members; do not gate sign-in on per-session policy checkboxes. Preserve the separate checkout and account-deletion acknowledgements.

Membership status labels have only two values: subscribed and not subscribed. The verified administrator counts as subscribed; a syncing indicator must not appear as a third status.

**Why:** the user requested that the parent area stop showing data synchronization and show only the two membership states, without changing other behavior.

**How to apply:** derive the label from account access, including the complimentary administrator entitlement. Load billing dates separately and do not turn their delay into a third membership state.
