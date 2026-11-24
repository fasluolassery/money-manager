import { CURRENCY, MAX_AMOUNT_PAISE } from "@money-manager/shared";
import { registerCollection } from "../../db/indexes.js";

export const PROFILES_COLLECTION = "profiles";

/** How a profile is stored (DESIGN 5.3). `openingBalance` is signed paise. */
export type ProfileDocument = {
  userId: string;
  timezone: string;
  openingBalance: number;
  openingBalanceDate: string;
  currency: typeof CURRENCY;
  lastBackupAt: Date | null;
  onboardedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

const profilesValidator = {
  bsonType: "object",
  required: [
    "userId",
    "timezone",
    "openingBalance",
    "openingBalanceDate",
    "currency",
    "lastBackupAt",
    "onboardedAt",
    "createdAt",
    "updatedAt",
    "version",
  ],
  properties: {
    userId: { bsonType: "string", minLength: 1 },
    timezone: { bsonType: "string", minLength: 1 },
    // The one money field that may be zero or negative (Spec Rule 9, DESIGN 5.6).
    openingBalance: {
      bsonType: ["int", "long"],
      minimum: -MAX_AMOUNT_PAISE,
      maximum: MAX_AMOUNT_PAISE,
    },
    openingBalanceDate: { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    currency: { enum: [CURRENCY] },
    lastBackupAt: { bsonType: ["date", "null"] },
    onboardedAt: { bsonType: ["date", "null"] },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
    version: { bsonType: ["int", "long"], minimum: 1 },
  },
};

// One profile per user (DESIGN 5.4).
registerCollection({
  name: PROFILES_COLLECTION,
  indexes: [{ key: { userId: 1 }, options: { unique: true, name: "userId" } }],
  validator: profilesValidator,
});
