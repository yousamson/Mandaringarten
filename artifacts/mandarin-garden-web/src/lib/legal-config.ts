/**
 * Legal operator details. Intentionally blank until the operator supplies real
 * details. While incomplete, legal pages show a "draft, not for publication" notice.
 */
export const LEGAL_VERSION = '2026-10-29.1' as const;

export const legalConfig = {
  /** Legal name of the business or individual operating Mandarin Garden. */
  operatorName: '',
  /** Contact email for privacy, data-rights and billing requests. */
  contactEmail: '',
  /** Postal address (optional but recommended). */
  postalAddress: '',
  /** Country / region whose law governs the terms. */
  governingRegion: '',
};

export const legalConfigComplete = Boolean(legalConfig.operatorName.trim() && legalConfig.contactEmail.trim());

export const LEGAL_SOURCES = {
  privacy: 'https://automattic.com/privacy/',
  terms: 'https://wordpress.com/tos/',
  licence: 'https://creativecommons.org/licenses/by-sa/4.0/',
};
