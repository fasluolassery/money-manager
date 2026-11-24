// @vitest-environment jsdom
import { isTimezone } from "@money-manager/shared";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { detectTimezone, listTimezones } from "../timezones.js";
import { TimezonePicker } from "./TimezonePicker.js";

// jsdom lacks what cmdk and Radix use to size and scroll the list.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});

function Harness() {
  const [zone, setZone] = useState("Asia/Kolkata");
  return <TimezonePicker value={zone} onChange={setZone} />;
}

describe("TimezonePicker", () => {
  it("[FR-13.2] shows the timezone with a Change button that opens a searchable list", async () => {
    render(<Harness />);
    expect(screen.getByText("Asia/Kolkata")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    await userEvent.type(screen.getByRole("combobox", { name: "Search timezones" }), "dubai");

    expect(screen.getByRole("option", { name: "Asia/Dubai" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "Europe/London" })).toBeNull();
  });

  it("[FR-13.2] changes the timezone to the one I pick and closes the list", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    await userEvent.type(screen.getByRole("combobox", { name: "Search timezones" }), "dubai");

    await userEvent.click(screen.getByRole("option", { name: "Asia/Dubai" }));

    expect(screen.getByText("Asia/Dubai")).toBeDefined();
    expect(screen.queryByRole("option", { name: "Asia/Dubai" })).toBeNull();
  });
});

describe("timezones", () => {
  it("[FR-13.2] lists real timezones, Asia/Kolkata first among India's, and the one chosen", () => {
    const zones = listTimezones("Pacific/Fiji");
    expect(zones.every(isTimezone)).toBe(true);
    expect(zones).toContain("Asia/Kolkata");
    expect(zones).toContain("Pacific/Fiji");
    expect(zones).not.toContain("Asia/Calcutta");
  });

  it("[FR-13.2] detects a valid timezone from the device", () => {
    expect(isTimezone(detectTimezone())).toBe(true);
  });
});
