import type { z } from "zod";

/** A date with no time of day, "YYYY-MM-DD" (Spec Rule 9). Compares correctly as a string. */
export type CalendarDate = string & z.$brand<"CalendarDate">;
/** A calendar month, "YYYY-MM". */
export type Month = string & z.$brand<"Month">;

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const THIRTY_DAY_MONTHS = new Set([4, 6, 9, 11]);

const padTwoDigits = (value: number) => String(value).padStart(2, "0");
const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

function countDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return THIRTY_DAY_MONTHS.has(month) ? 30 : 31;
}

const isMonthNumber = (month: number) => month >= 1 && month <= 12;

export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== "string") return false;
  const match = CALENDAR_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  return isMonthNumber(month) && day >= 1 && day <= countDaysInMonth(year, month);
}

export function isMonth(value: unknown): value is Month {
  if (typeof value !== "string") return false;
  const match = MONTH.exec(value);
  return match !== null && isMonthNumber(Number(match[2]));
}

/** Whether the built-in `Intl` API knows this IANA timezone, e.g. "Asia/Kolkata". */
export function isTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value === "") return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Today's calendar date in a timezone, at the instant `now` (Spec Rule 9). */
export function todayIn(timezone: string, now: Date): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}` as CalendarDate;
}

export function monthOf(date: CalendarDate): Month {
  return date.slice(0, 7) as Month;
}

/** The first and last day of a calendar month (Spec Rule 14). */
export function monthBounds(month: Month): { first: CalendarDate; last: CalendarDate } {
  const last = countDaysInMonth(Number(month.slice(0, 4)), Number(month.slice(5, 7)));
  return {
    first: `${month}-01` as CalendarDate,
    last: `${month}-${padTwoDigits(last)}` as CalendarDate,
  };
}

function splitDate(date: CalendarDate) {
  const [year = "", month = "", day = ""] = date.split("-");
  return { year, month, day };
}

/** "10 Nov 2026", for lists (Spec Rule 14). */
export function formatListDate(date: CalendarDate): string {
  const { year, month, day } = splitDate(date);
  return `${Number(day)} ${MONTH_NAMES[Number(month) - 1] ?? ""} ${year}`;
}

/** "10/11/2026" (DD/MM/YYYY), for forms (Spec Rule 14). */
export function formatFormDate(date: CalendarDate): string {
  const { year, month, day } = splitDate(date);
  return `${day}/${month}/${year}`;
}
