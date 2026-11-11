import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { type CalendarDate, isCalendarDate } from "../dates.js";
import { MAX_AMOUNT_PAISE, type Paise } from "../money.js";
import {
  amountSchema,
  billIdSchema,
  billNameSchema,
  calendarDateSchema,
  categoryIdSchema,
  categoryNameSchema,
  dateNotInFutureSchema,
  dateNotInPastSchema,
  goalIdSchema,
  goalNameSchema,
  lendingRecordIdSchema,
  VALIDATION_MESSAGES as M,
  monthSchema,
  noteSchema,
  openingBalanceSchema,
  payeeSchema,
  personSchema,
  TEXT_LIMITS,
  timezoneSchema,
  transactionIdSchema,
  userIdSchema,
} from "./common.js";

function today(value: string): CalendarDate {
  if (!isCalendarDate(value)) throw new Error(value);
  return value;
}

const messagesOf = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues.map((issue) => issue.message) ?? [];

const OUR_MESSAGES = new Set(
  Object.values(M).flatMap((m) => (typeof m === "string" ? [m] : Object.values(m))),
);

describe("amounts", () => {
  it("[FR-9.2] are whole paise, more than 0 and at most ₹1,00,00,000", () => {
    const valid: Paise = amountSchema.parse(1);
    expect(valid).toBe(1);
    expect(amountSchema.parse(MAX_AMOUNT_PAISE)).toBe(MAX_AMOUNT_PAISE);
    expect(messagesOf(amountSchema, 0)).toEqual([M.amountTooSmall]);
    expect(messagesOf(amountSchema, -5)).toEqual([M.amountTooSmall]);
    expect(messagesOf(amountSchema, MAX_AMOUNT_PAISE + 1)).toEqual([M.amountTooLarge]);
    expect(messagesOf(amountSchema, 12.5)).toEqual([M.amountNotWhole]);
    expect(messagesOf(amountSchema, "100")).toEqual([M.amountMissing]);
  });

  it("[FR-9.2] allow the opening balance to be zero or negative, down to −₹1,00,00,000", () => {
    expect(openingBalanceSchema.parse(0)).toBe(0);
    expect(openingBalanceSchema.parse(-MAX_AMOUNT_PAISE)).toBe(-MAX_AMOUNT_PAISE);
    expect(messagesOf(openingBalanceSchema, -MAX_AMOUNT_PAISE - 1)).toEqual([
      M.openingBalanceTooLow,
    ]);
    expect(messagesOf(openingBalanceSchema, MAX_AMOUNT_PAISE + 1)).toEqual([
      M.openingBalanceTooHigh,
    ]);
  });
});

describe("dates", () => {
  it("[FR-9.7] are calendar dates without a time of day, and months are YYYY-MM", () => {
    expect(calendarDateSchema.parse("2026-11-10")).toBe("2026-11-10");
    expect(messagesOf(calendarDateSchema, "2026-11-10T09:00:00Z")).toEqual([M.date]);
    expect(monthSchema.parse("2026-11")).toBe("2026-11");
    expect(messagesOf(monthSchema, "2026-13")).toEqual([M.month]);
  });

  it("[FR-9.3] of money events can't be after today in the user's timezone", () => {
    const schema = dateNotInFutureSchema(today("2026-11-10"));
    expect(schema.parse("2026-11-10")).toBe("2026-11-10");
    expect(schema.parse("2025-01-01")).toBe("2025-01-01");
    expect(messagesOf(schema, "2026-11-11")).toEqual([M.dateInFuture]);
  });

  it("[FR-9.4] for due dates may be in the future, and deadlines can't be in the past when set", () => {
    expect(calendarDateSchema.parse("2030-01-31")).toBe("2030-01-31");
    const deadline = dateNotInPastSchema(today("2026-11-10"));
    expect(deadline.parse("2026-11-10")).toBe("2026-11-10");
    expect(deadline.parse("2027-06-01")).toBe("2027-06-01");
    expect(messagesOf(deadline, "2026-11-09")).toEqual([M.dateInPast]);
  });

  it("[FR-9.8] use an IANA timezone the server knows", () => {
    expect(timezoneSchema.parse("Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(messagesOf(timezoneSchema, "Not/AZone")).toEqual([M.timezone]);
  });
});

describe("text", () => {
  it("[FR-9.5] is trimmed before its length is checked", () => {
    expect(categoryNameSchema.parse("  Food  ")).toBe("Food");
    expect(categoryNameSchema.parse(`  ${"a".repeat(TEXT_LIMITS.categoryName)}  `)).toHaveLength(
      40,
    );
    expect(messagesOf(categoryNameSchema, "   ")).toEqual([M.categoryName.empty]);
  });

  it("[FR-9.5] keeps to the length limits of each field", () => {
    const cases = [
      [categoryNameSchema, TEXT_LIMITS.categoryName, M.categoryName.tooLong],
      [billNameSchema, TEXT_LIMITS.billName, M.billName.tooLong],
      [goalNameSchema, TEXT_LIMITS.goalName, M.goalName.tooLong],
      [personSchema, TEXT_LIMITS.person, M.person.tooLong],
      [payeeSchema, TEXT_LIMITS.payee, M.payee.tooLong],
      [noteSchema, TEXT_LIMITS.note, M.note.tooLong],
    ] as const;
    for (const [schema, limit, message] of cases) {
      expect(schema.parse("x".repeat(limit))).toHaveLength(limit);
      expect(messagesOf(schema, "x".repeat(limit + 1))).toEqual([message]);
    }
    expect(messagesOf(billNameSchema, "")).toEqual([M.billName.empty]);
  });

  it("[FR-9.5] treats the same name typed two ways as one name (Unicode NFC)", () => {
    const composed = "Caf\u00e9";
    const decomposed = "Cafe\u0301";
    expect(categoryNameSchema.parse(decomposed)).toBe(composed);
    fc.assert(
      fc.property(fc.string({ unit: "grapheme", maxLength: 20 }), (text) => {
        const viaNfd = categoryNameSchema.safeParse(text.normalize("NFD"));
        const viaNfc = categoryNameSchema.safeParse(text.normalize("NFC"));
        expect(viaNfd.data).toBe(viaNfc.data);
      }),
    );
  });

  it("[FR-9.5] stores empty optional text as null", () => {
    for (const value of ["", "   ", null]) {
      expect(payeeSchema.parse(value)).toBeNull();
      expect(noteSchema.parse(value)).toBeNull();
    }
    expect(noteSchema.parse("  Rent for Nov ")).toBe("Rent for Nov");
  });
});

describe("ids", () => {
  it("are MongoDB ObjectId strings for app records, and any non-empty string for users", () => {
    const id = "6553f1c2a4b5c6d7e8f90123";
    for (const schema of [
      transactionIdSchema,
      categoryIdSchema,
      billIdSchema,
      goalIdSchema,
      lendingRecordIdSchema,
    ]) {
      expect(schema.parse(id)).toBe(id);
      expect(messagesOf(schema, "abc")).toEqual([M.invalid]);
    }
    expect(userIdSchema.parse("user-1")).toBe("user-1");
    expect(messagesOf(userIdSchema, "")).toEqual([M.invalid]);
  });
});

describe("messages", () => {
  const schemas = [
    amountSchema,
    openingBalanceSchema,
    calendarDateSchema,
    monthSchema,
    timezoneSchema,
    dateNotInFutureSchema(today("2026-11-10")),
    dateNotInPastSchema(today("2026-11-10")),
    categoryNameSchema,
    billNameSchema,
    goalNameSchema,
    personSchema,
    payeeSchema,
    noteSchema,
    transactionIdSchema,
    userIdSchema,
  ];

  it("never come from Zod: any input to any shared schema fails only with our messages", () => {
    fc.assert(
      fc.property(fc.anything(), fc.integer({ min: 0, max: schemas.length - 1 }), (value, i) => {
        for (const message of messagesOf(schemas[i] ?? amountSchema, value))
          expect(OUR_MESSAGES.has(message), message).toBe(true);
      }),
      { numRuns: 2000 },
    );
  });

  it('fall back to "This value isn\'t valid" for a rule without its own message', () => {
    expect(messagesOf(z.string(), 42)).toEqual([M.invalid]);
    expect(messagesOf(z.object({ a: z.number() }), { a: "x" })).toEqual([M.invalid]);
  });
});
