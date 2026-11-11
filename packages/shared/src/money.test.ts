import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  formatRupees,
  formatRupeesCompact,
  formatSignedRupees,
  MAX_AMOUNT_PAISE,
  type Paise,
  parseRupees,
} from "./money.js";

const paise = (value: number) => value as Paise;
const fromRupees = (rupees: string) => paise(Number(`${rupees}00`));
const INDIAN_FORMAT = /^−?₹(?:\d{1,2}(?:,\d{2})*,)?\d{1,3}(?:\.\d{2})?$/;

describe("parseRupees", () => {
  it("[FR-9.1] turns typed rupees into whole paise", () => {
    expect(parseRupees("125.50")).toBe(12550);
    expect(parseRupees("125.5")).toBe(12550);
    expect(parseRupees("125")).toBe(12500);
    expect(parseRupees(" 10000000 ")).toBe(MAX_AMOUNT_PAISE);
  });

  it("[FR-9.2] rejects empty, non-numeric, negative, more than 2 decimals and above ₹1,00,00,000", () => {
    for (const input of ["", "  ", "abc", "12a", "-5", "1.234", "10000000.01", "1e3", "1,000", "."])
      expect(parseRupees(input), input).toBeNull();
  });

  it("[FR-9.1] adds amounts exactly, with no floating-point drift", () => {
    const sum = (parseRupees("0.10") ?? Number.NaN) + (parseRupees("0.20") ?? Number.NaN);
    expect(sum).toBe(30);
  });

  it("[FR-9.1] gives back exactly the paise that were typed, for any valid amount", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9_999_999 }),
        fc.integer({ min: 0, max: 99 }),
        (r, p) => {
          const digits = String(p).padStart(2, "0");
          expect(parseRupees(`${r}.${digits}`)).toBe(Number(`${r}${digits}`));
        },
      ),
    );
  });
});

describe("formatRupees", () => {
  it("[FR-14.1] shows ₹ with Indian grouping, and paise only when non-zero", () => {
    expect(formatRupees(paise(12550))).toBe("₹125.50");
    expect(formatRupees(paise(125000))).toBe("₹1,250");
    expect(formatRupees(paise(125050))).toBe("₹1,250.50");
    expect(formatRupees(paise(10000000))).toBe("₹1,00,000");
    expect(formatRupees(paise(0))).toBe("₹0");
  });

  it("[FR-14.1] [FR-14.2] groups 4 to 9 digit amounts the Indian way, positive and negative", () => {
    const cases = [
      ["1234", "1,234"],
      ["12345", "12,345"],
      ["123456", "1,23,456"],
      ["1234567", "12,34,567"],
      ["12345678", "1,23,45,678"],
      ["123456789", "12,34,56,789"],
    ];
    for (const [rupees = "", shown] of cases) {
      expect(formatRupees(fromRupees(rupees))).toBe(`₹${shown}`);
      expect(formatRupees(fromRupees(`-${rupees}`))).toBe(`−₹${shown}`);
    }
  });

  it("[FR-14.2] puts the true minus sign before ₹: −₹2,000, never ₹-2,000", () => {
    const shown = formatRupees(paise(-200000));
    expect(shown).toBe("\u2212₹2,000");
    expect(shown).not.toContain("-");
  });

  it("[FR-14.1] [FR-14.2] always produces Indian grouping that reads back as the same amount", () => {
    fc.assert(
      fc.property(fc.integer({ min: -MAX_AMOUNT_PAISE, max: MAX_AMOUNT_PAISE }), (value) => {
        const shown = formatRupees(paise(value));
        expect(shown).toMatch(INDIAN_FORMAT);
        expect(parseRupees(shown.replace(/[−₹,]/g, ""))).toBe(Math.abs(value));
      }),
    );
  });
});

describe("formatSignedRupees", () => {
  it("[FR-14.3] gives income and positive left over a +, negative a −, and zero no sign", () => {
    expect(formatSignedRupees(paise(5500000))).toBe("+₹55,000");
    expect(formatSignedRupees(paise(-200000))).toBe("−₹2,000");
    expect(formatSignedRupees(paise(0))).toBe("₹0");
  });
});

describe("formatRupeesCompact", () => {
  it("[FR-14.1] shortens chart axis amounts: ₹950, ₹18.5K, ₹1.2L, ₹1.5Cr", () => {
    expect(formatRupeesCompact(paise(95000))).toBe("₹950");
    expect(formatRupeesCompact(paise(1850000))).toBe("₹18.5K");
    expect(formatRupeesCompact(paise(12000000))).toBe("₹1.2L");
    expect(formatRupeesCompact(paise(1500000000))).toBe("₹1.5Cr");
    expect(formatRupeesCompact(paise(0))).toBe("₹0");
  });

  it("[FR-14.1] moves up a unit when rounding reaches it, and drops a trailing .0", () => {
    expect(formatRupeesCompact(paise(99996))).toBe("₹1K");
    expect(formatRupeesCompact(paise(9999000))).toBe("₹1L");
    expect(formatRupeesCompact(paise(1845000))).toBe("₹18.5K");
    expect(formatRupeesCompact(paise(2000000))).toBe("₹20K");
    expect(formatRupeesCompact(paise(-12000000))).toBe("−₹1.2L");
  });

  it("[FR-14.1] never shows more than one decimal or a trailing .0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100 * MAX_AMOUNT_PAISE, max: 100 * MAX_AMOUNT_PAISE }),
        (v) => {
          const shown = formatRupeesCompact(paise(v));
          expect(shown).toMatch(/^−?₹[\d,]+(?:\.[1-9])?(?:K|L|Cr)?$/);
        },
      ),
    );
  });
});
