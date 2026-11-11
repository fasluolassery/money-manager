import { z } from "zod";
import { type CalendarDate, isCalendarDate, isMonth, isTimezone, type Month } from "../dates.js";
import { MAX_AMOUNT_PAISE } from "../money.js";

/** Text limits from Spec Rule 9 (FR-9.5). */
export const TEXT_LIMITS = {
  categoryName: 40,
  billName: 60,
  goalName: 60,
  person: 60,
  payee: 100,
  note: 500,
} as const;

const textMessages = (label: string, max: number) => ({
  empty: `${label} can't be empty`,
  tooLong: `${label} can be up to ${max} characters`,
});

/** Every message a shared schema can produce (DESIGN 9.6). */
export const VALIDATION_MESSAGES = {
  invalid: "This value isn't valid",
  amountMissing: "Enter an amount",
  amountNotWhole: "Amount must be a whole number of paise",
  amountTooSmall: "Amount must be more than ₹0",
  amountTooLarge: "Amount can be at most ₹1,00,00,000",
  openingBalanceTooLow: "Opening balance can't be below −₹1,00,00,000",
  openingBalanceTooHigh: "Opening balance can be at most ₹1,00,00,000",
  date: "Enter a valid date",
  dateInFuture: "Date can't be in the future",
  dateInPast: "Date can't be in the past",
  month: "Enter a valid month",
  timezone: "Choose a valid timezone",
  categoryName: textMessages("Category name", TEXT_LIMITS.categoryName),
  billName: textMessages("Bill name", TEXT_LIMITS.billName),
  goalName: textMessages("Goal name", TEXT_LIMITS.goalName),
  person: textMessages("Name", TEXT_LIMITS.person),
  payee: textMessages("Payee", TEXT_LIMITS.payee),
  note: textMessages("Note", TEXT_LIMITS.note),
} as const;

const M = VALIDATION_MESSAGES;

// Any rule without its own message falls back to ours, never Zod's text (DESIGN 9.6).
z.config({ customError: () => M.invalid });

const wholePaise = () => z.number({ error: M.amountMissing }).int({ error: M.amountNotWhole });

/** A positive amount in paise, at most ₹1,00,00,000 (FR-9.2). */
export const amountSchema = wholePaise()
  .min(1, { error: M.amountTooSmall })
  .max(MAX_AMOUNT_PAISE, { error: M.amountTooLarge })
  .brand<"Paise">();

/** The opening balance may be zero or negative, down to −₹1,00,00,000 (FR-9.2). */
export const openingBalanceSchema = wholePaise()
  .min(-MAX_AMOUNT_PAISE, { error: M.openingBalanceTooLow })
  .max(MAX_AMOUNT_PAISE, { error: M.openingBalanceTooHigh })
  .brand<"Paise">();

export const calendarDateSchema = z.custom<CalendarDate>(isCalendarDate, { error: M.date });
export const monthSchema = z.custom<Month>(isMonth, { error: M.month });
export const timezoneSchema = z.custom<string>(isTimezone, { error: M.timezone });

/** Money-event dates can't be after today in the user's timezone (FR-9.3). */
export const dateNotInFutureSchema = (today: CalendarDate) =>
  calendarDateSchema.refine((date) => date <= today, { error: M.dateInFuture });

/** Deadlines can't be before today in the user's timezone when set (FR-9.4). */
export const dateNotInPastSchema = (today: CalendarDate) =>
  calendarDateSchema.refine((date) => date >= today, { error: M.dateInPast });

const cleanText = () => z.string().trim().normalize("NFC");

const requiredText = (max: number, messages: { empty: string; tooLong: string }) =>
  cleanText().min(1, { error: messages.empty }).max(max, { error: messages.tooLong });

// Empty optional text is stored as null, never "" (DESIGN 5.1).
const optionalText = (max: number, messages: { tooLong: string }) =>
  cleanText()
    .max(max, { error: messages.tooLong })
    .transform((text) => text || null)
    .nullable();

export const categoryNameSchema = requiredText(TEXT_LIMITS.categoryName, M.categoryName);
export const billNameSchema = requiredText(TEXT_LIMITS.billName, M.billName);
export const goalNameSchema = requiredText(TEXT_LIMITS.goalName, M.goalName);
export const personSchema = requiredText(TEXT_LIMITS.person, M.person);
export const payeeSchema = optionalText(TEXT_LIMITS.payee, M.payee);
export const noteSchema = optionalText(TEXT_LIMITS.note, M.note);

const objectId = () => z.string().regex(/^[0-9a-f]{24}$/i, { error: M.invalid });

export const transactionIdSchema = objectId().brand<"TransactionId">();
export const categoryIdSchema = objectId().brand<"CategoryId">();
export const billIdSchema = objectId().brand<"BillId">();
export const goalIdSchema = objectId().brand<"GoalId">();
export const lendingRecordIdSchema = objectId().brand<"LendingRecordId">();
// Better Auth decides the user id's format (SPEC Q-06, issue #16), so only presence is checked.
export const userIdSchema = z.string().min(1, { error: M.invalid }).brand<"UserId">();

export type TransactionId = z.infer<typeof transactionIdSchema>;
export type CategoryId = z.infer<typeof categoryIdSchema>;
export type BillId = z.infer<typeof billIdSchema>;
export type GoalId = z.infer<typeof goalIdSchema>;
export type LendingRecordId = z.infer<typeof lendingRecordIdSchema>;
export type UserId = z.infer<typeof userIdSchema>;
