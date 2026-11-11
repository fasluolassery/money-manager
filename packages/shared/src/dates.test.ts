import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  type CalendarDate,
  formatFormDate,
  formatListDate,
  isCalendarDate,
  isMonth,
  isTimezone,
  type Month,
  monthBounds,
  monthOf,
  todayIn,
} from "./dates.js";

function date(value: string): CalendarDate {
  if (!isCalendarDate(value)) throw new Error(`Not a calendar date: ${value}`);
  return value;
}

function month(value: string): Month {
  if (!isMonth(value)) throw new Error(`Not a month: ${value}`);
  return value;
}

const anyDate = fc
  .date({
    min: new Date("1900-01-01T00:00:00Z"),
    max: new Date("2200-12-31T00:00:00Z"),
    noInvalidDate: true,
  })
  .map((d) => date(d.toISOString().slice(0, 10)));

describe("calendar dates", () => {
  it("[FR-9.7] are YYYY-MM-DD with no time of day, and real days only", () => {
    expect(isCalendarDate("2026-11-10")).toBe(true);
    expect(isCalendarDate("2028-02-29")).toBe(true);
    for (const value of [
      "2026-11-10T10:00",
      "2026-13-01",
      "2026-02-29",
      "2026-04-31",
      "2026-2-1",
      "",
      20261110,
      null,
    ])
      expect(isCalendarDate(value), String(value)).toBe(false);
  });

  it("[FR-9.7] accepts every real day between 1900 and 2200", () => {
    fc.assert(
      fc.property(anyDate, (d) => {
        expect(isCalendarDate(d)).toBe(true);
      }),
    );
  });
});

describe("todayIn", () => {
  it("[FR-9.8] [FR-9.7] gives the previous day at 18:29 UTC and the next day at 18:31 UTC in Asia/Kolkata", () => {
    expect(todayIn("Asia/Kolkata", new Date("2026-11-09T18:29:00Z"))).toBe("2026-11-09");
    expect(todayIn("Asia/Kolkata", new Date("2026-11-09T18:31:00Z"))).toBe("2026-11-10");
  });

  it("[FR-9.8] follows the user's own timezone", () => {
    const instant = new Date("2026-11-10T03:00:00Z");
    expect(todayIn("America/New_York", instant)).toBe("2026-11-09");
    expect(todayIn("Asia/Kolkata", instant)).toBe("2026-11-10");
  });

  it("[FR-9.8] in Asia/Kolkata is always the UTC date 5 hours 30 minutes later", () => {
    const istOffset = 330 * 60 * 1000;
    fc.assert(
      fc.property(
        fc.date({ noInvalidDate: true, min: new Date(0), max: new Date("2200-01-01") }),
        (now) => {
          const expected = new Date(now.getTime() + istOffset).toISOString().slice(0, 10);
          expect(todayIn("Asia/Kolkata", now)).toBe(expected);
        },
      ),
    );
  });

  it("[FR-9.8] only accepts timezones the built-in Intl API knows", () => {
    expect(isTimezone("Asia/Kolkata")).toBe(true);
    expect(isTimezone("Europe/London")).toBe(true);
    for (const value of ["Mars/Base", "", "+05:30x", 5, null])
      expect(isTimezone(value)).toBe(false);
  });
});

describe("months", () => {
  it("[FR-14.5] run from the 1st to the last day of the calendar month", () => {
    expect(monthOf(date("2026-11-10"))).toBe("2026-11");
    expect(monthBounds(month("2026-11"))).toEqual({ first: "2026-11-01", last: "2026-11-30" });
    expect(monthBounds(month("2026-12")).last).toBe("2026-12-31");
  });

  it("[FR-14.5] give February 29 days in leap years and 28 otherwise", () => {
    expect(monthBounds(month("2028-02")).last).toBe("2028-02-29");
    expect(monthBounds(month("2026-02")).last).toBe("2026-02-28");
    expect(monthBounds(month("2000-02")).last).toBe("2000-02-29");
    expect(monthBounds(month("2100-02")).last).toBe("2100-02-28");
  });

  it("[FR-14.5] always contain the day they were taken from", () => {
    fc.assert(
      fc.property(anyDate, (d) => {
        const { first, last } = monthBounds(monthOf(d));
        expect(first <= d && d <= last).toBe(true);
        expect(isCalendarDate(last)).toBe(true);
      }),
    );
  });
});

describe("date formats", () => {
  it("[FR-14.4] show 10 Nov 2026 in lists and 10/11/2026 in forms", () => {
    expect(formatListDate(date("2026-11-10"))).toBe("10 Nov 2026");
    expect(formatListDate(date("2026-01-05"))).toBe("5 Jan 2026");
    expect(formatFormDate(date("2026-11-10"))).toBe("10/11/2026");
    expect(formatFormDate(date("2026-01-05"))).toBe("05/01/2026");
  });

  it("[FR-14.4] write every date as DD/MM/YYYY that reads back as the same date", () => {
    fc.assert(
      fc.property(anyDate, (d) => {
        expect(formatFormDate(d).split("/").reverse().join("-")).toBe(d);
      }),
    );
  });
});
