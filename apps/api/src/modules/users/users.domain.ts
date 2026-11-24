import {
  type CalendarDate,
  CURRENCY,
  DEFAULT_TIMEZONE,
  INITIAL_RECORD_VERSION,
  type MeResponse,
  type Paise,
  type PatchMeBody,
} from "@money-manager/shared";

/** A profile as the service sees it: plain values, no database types (DESIGN 5.3). */
export type Profile = {
  /** The document's `_id` as a hex string. */
  id: string;
  userId: string;
  timezone: string;
  openingBalance: Paise;
  openingBalanceDate: CalendarDate;
  currency: typeof CURRENCY;
  lastBackupAt: Date | null;
  onboardedAt: Date | null;
  version: number;
};

export type NewProfile = Omit<Profile, "id"> & { createdAt: Date; updatedAt: Date };

/** What `PATCH /me` writes; the repository adds the version bump. */
export type ProfileChanges = Partial<
  Pick<Profile, "timezone" | "openingBalance" | "openingBalanceDate" | "onboardedAt">
> & { updatedAt: Date };

/** The name and email Better Auth keeps for the signed-in user. */
export type UserIdentity = { name: string; email: string };

/**
 * The profile a new user starts with: `Asia/Kolkata`, balance 0 dated `today` (in that
 * timezone), not onboarded yet (FR-13.1, DESIGN 7.2).
 */
export function buildNewProfile(userId: string, now: Date, today: CalendarDate): NewProfile {
  return {
    userId,
    timezone: DEFAULT_TIMEZONE,
    openingBalance: 0 as Paise,
    openingBalanceDate: today,
    currency: CURRENCY,
    lastBackupAt: null,
    onboardedAt: null,
    createdAt: now,
    updatedAt: now,
    version: INITIAL_RECORD_VERSION,
  };
}

/**
 * What a `PATCH /me` changes. The welcome screen's Continue and Skip both land here, so the
 * first save also marks the profile onboarded and later saves leave that date alone (FR-13.4).
 */
export function buildProfileChanges(
  profile: Pick<Profile, "onboardedAt">,
  body: Pick<PatchMeBody, "timezone" | "openingBalance" | "openingBalanceDate">,
  now: Date,
): ProfileChanges {
  return {
    timezone: body.timezone,
    ...(body.openingBalance !== undefined && { openingBalance: body.openingBalance }),
    ...(body.openingBalanceDate !== undefined && { openingBalanceDate: body.openingBalanceDate }),
    onboardedAt: profile.onboardedAt ?? now,
    updatedAt: now,
  };
}

/** The `GET /me` shape: profile settings plus the user's name and email (DESIGN 6.6). */
export function toMeResponse(profile: Profile, identity: UserIdentity): MeResponse {
  return {
    name: identity.name,
    email: identity.email,
    timezone: profile.timezone,
    openingBalance: profile.openingBalance,
    openingBalanceDate: profile.openingBalanceDate,
    currency: profile.currency,
    lastBackupAt: profile.lastBackupAt?.toISOString() ?? null,
    onboardedAt: profile.onboardedAt?.toISOString() ?? null,
    version: profile.version,
  };
}
