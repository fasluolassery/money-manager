import type { z } from "zod";

/** An amount in paise (₹1 = 100 paise), always a whole number (Spec Rule 9). */
export type Paise = number & z.$brand<"Paise">;

/** ₹1,00,00,000 (one crore), the largest amount allowed (Spec Rule 4). */
export const MAX_AMOUNT_PAISE = 1_000_000_000;

/** The only currency the app handles (Spec Rule 9). */
export const CURRENCY = "INR";

const PAISE_PER_RUPEE = 100;
const MINUS = "\u2212";
const RUPEES_INPUT = /^(\d+)(?:\.(\d{1,2}))?$/;
const LEADING_MINUS = /^[-\u2212]/;
const TYPED_RUPEES = /^(-?)(\d*)(\.\d*)?$/;
const indianGrouping = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/**
 * Typed rupees to paise: "125.50" → 12550. Returns null for anything that isn't
 * a non-negative amount with at most 2 decimals and at most ₹1,00,00,000.
 */
export function parseRupees(input: string): Paise | null {
  const match = RUPEES_INPUT.exec(input.trim());
  if (!match) return null;
  const [, rupees = "", fraction = ""] = match;
  const paise = Number(rupees) * PAISE_PER_RUPEE + Number(fraction.padEnd(2, "0"));
  return paise <= MAX_AMOUNT_PAISE ? (paise as Paise) : null;
}

/**
 * Like `parseRupees`, but accepts a leading "-" or "−" for amounts that may be negative
 * (the opening balance, Spec Rule 9): "-1250.50" → -125050. Returns null beyond ±₹1,00,00,000.
 */
export function parseSignedRupees(input: string): Paise | null {
  const trimmed = input.trim();
  const negative = LEADING_MINUS.test(trimmed);
  const magnitude = parseRupees(negative ? trimmed.slice(1) : trimmed);
  if (magnitude === null) return null;
  return (negative && magnitude !== 0 ? -magnitude : magnitude) as Paise;
}

/**
 * Re-groups text typed into a money field, keeping what was typed after the digits:
 * "1234567." → "12,34,567."; "-1250.5" → "-1,250.5". Text that isn't a partial amount is returned as is.
 */
export function groupRupeesInput(typed: string): string {
  const match = TYPED_RUPEES.exec(typed);
  if (!match) return typed;
  const [, sign = "", digits = "", fraction = ""] = match;
  const grouped = digits === "" ? "" : indianGrouping.format(Number(digits));
  return `${sign}${grouped}${fraction}`;
}

/** The text a money field shows for an amount: 12550 → "125.50"; -125000 → "-1,250" (no ₹ sign). */
export function formatRupeesInput(paise: Paise): string {
  const { rupees, remainder } = splitPaise(paise);
  const fraction = remainder ? `.${String(remainder).padStart(2, "0")}` : "";
  return `${paise < 0 ? "-" : ""}${indianGrouping.format(rupees)}${fraction}`;
}

function splitPaise(paise: number) {
  const magnitude = Math.abs(paise);
  return {
    sign: paise < 0 ? MINUS : "",
    rupees: Math.trunc(magnitude / PAISE_PER_RUPEE),
    remainder: magnitude % PAISE_PER_RUPEE,
  };
}

/** 125000 → "₹1,250"; 12550 → "₹125.50"; -200000 → "−₹2,000" (Spec Rule 14). */
export function formatRupees(paise: Paise): string {
  const { sign, rupees, remainder } = splitPaise(paise);
  const fraction = remainder ? `.${String(remainder).padStart(2, "0")}` : "";
  return `${sign}₹${indianGrouping.format(rupees)}${fraction}`;
}

/** Income and "left over" carry a sign: "+₹55,000", "−₹2,000", "₹0" (Spec Rule 14). */
export function formatSignedRupees(paise: Paise): string {
  return paise > 0 ? `+${formatRupees(paise)}` : formatRupees(paise);
}

const RUPEE = { suffix: "", paise: PAISE_PER_RUPEE };
const COMPACT_UNITS = [
  { suffix: "Cr", paise: 10_000_000 * PAISE_PER_RUPEE },
  { suffix: "L", paise: 100_000 * PAISE_PER_RUPEE },
  { suffix: "K", paise: 1_000 * PAISE_PER_RUPEE },
  RUPEE,
];

// The unit is chosen by the amount's size; rounding up to a whole next unit
// (₹999.96 → 10000 tenths of a rupee) moves to that unit, so it reads ₹1K, not ₹1,000.
function pickCompactUnit(magnitude: number) {
  const found = COMPACT_UNITS.findIndex((unit) => magnitude >= unit.paise);
  const position = found === -1 ? COMPACT_UNITS.length - 1 : found;
  const unit = COMPACT_UNITS[position] ?? RUPEE;
  const bigger = COMPACT_UNITS[position - 1];
  const tenths = Math.round((magnitude * 10) / unit.paise);
  if (bigger && tenths * unit.paise >= bigger.paise * 10) {
    return { suffix: bigger.suffix, tenths: Math.round((magnitude * 10) / bigger.paise) };
  }
  return { suffix: unit.suffix, tenths };
}

/** Chart axes: ₹950, ₹18.5K, ₹1.2L, ₹1.5Cr, with at most one decimal (UI.md 4.10). */
export function formatRupeesCompact(paise: Paise): string {
  const sign = paise < 0 ? MINUS : "";
  const { suffix, tenths } = pickCompactUnit(Math.abs(paise));
  const whole = indianGrouping.format(Math.trunc(tenths / 10));
  const decimal = tenths % 10 ? `.${tenths % 10}` : "";
  return `${sign}₹${whole}${decimal}${suffix}`;
}
