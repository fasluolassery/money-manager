import { z } from "zod";
import { CURRENCY } from "../money.js";
import {
  calendarDateSchema,
  openingBalanceSchema,
  timezoneSchema,
  VALIDATION_MESSAGES,
  versionSchema,
} from "./common.js";

/** `GET /me` and `PATCH /me` response: name, email and the profile settings (DESIGN 6.5, 6.6). */
export const meResponseSchema = z.object({
  name: z.string(),
  email: z.string(),
  timezone: timezoneSchema,
  openingBalance: openingBalanceSchema,
  openingBalanceDate: calendarDateSchema,
  currency: z.literal(CURRENCY),
  lastBackupAt: z.iso.datetime().nullable(),
  onboardedAt: z.iso.datetime().nullable(),
  version: versionSchema,
});

/**
 * `PATCH /me` body (DESIGN 7.2). Continue sends the timezone, balance and date; Skip sends the
 * timezone only. The balance and its date go together. "Not in the future" needs the user's
 * timezone, so the API checks it against today's date there (FR-9.3).
 */
export const patchMeBodySchema = z
  .object({
    version: versionSchema,
    timezone: timezoneSchema,
    openingBalance: openingBalanceSchema.optional(),
    openingBalanceDate: calendarDateSchema.optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (body.openingBalance !== undefined && body.openingBalanceDate === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["openingBalanceDate"],
        message: VALIDATION_MESSAGES.date,
      });
    }
    if (body.openingBalanceDate !== undefined && body.openingBalance === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["openingBalance"],
        message: VALIDATION_MESSAGES.amountMissing,
      });
    }
  });

export type MeResponse = z.infer<typeof meResponseSchema>;
export type PatchMeBody = z.infer<typeof patchMeBodySchema>;
