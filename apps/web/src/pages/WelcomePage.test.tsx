// @vitest-environment jsdom
import { ERROR_MESSAGES, type MeResponse } from "@money-manager/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WelcomePage from "./WelcomePage.js";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));
vi.mock("@/features/users/timezones.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/users/timezones.js")>()),
  detectTimezone: () => "Asia/Kolkata",
}));

const ME: MeResponse = {
  name: "Save Fas",
  email: "save@example.com",
  timezone: "Asia/Kolkata",
  openingBalance: 0 as MeResponse["openingBalance"],
  openingBalanceDate: "2026-11-24" as MeResponse["openingBalanceDate"],
  currency: "INR",
  lastBackupAt: null,
  onboardedAt: null,
  version: 1,
};

type Reply = { status: number; body: unknown };
let patches: unknown[];
let patchReply: Reply;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-24T10:00:00.000Z"));
  patches = [];
  patchReply = {
    status: 200,
    body: { success: true, data: { ...ME, onboardedAt: "2026-11-24T10:00:00.000Z", version: 2 } },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      const isPatch = init?.method === "PATCH";
      if (isPatch) patches.push(JSON.parse(String(init?.body)));
      const reply = isPatch ? patchReply : { status: 200, body: { success: true, data: ME } };
      return { ok: reply.status < 400, status: reply.status, json: async () => reply.body };
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  toastError.mockReset();
});

function renderWelcome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/welcome", element: <WelcomePage /> },
      { path: "/", element: <div>Home screen</div> },
    ],
    { initialEntries: ["/welcome"] },
  );
  const wrap = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<RouterProvider router={router} />, { wrapper: wrap });
}

const user = () => userEvent.setup({ advanceTimers: () => {} });
const balance = () => screen.findByLabelText("Opening balance") as Promise<HTMLInputElement>;

describe("WelcomePage", () => {
  it("[FR-13.2] greets me by first name with ₹0, today's date and the detected timezone", async () => {
    renderWelcome();

    expect(await screen.findByRole("heading", { name: "Hi Save" })).toBeDefined();
    expect(screen.getByText("Let's set up your starting point.")).toBeDefined();
    expect((await balance()).value).toBe("0");
    expect(screen.getByRole("button", { name: "Today" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Asia/Kolkata")).toBeDefined();
    expect(screen.getByRole("button", { name: "Change" })).toBeDefined();
  });

  it("[FR-13.3] Continue saves the timezone, balance and date, then lands on Home", async () => {
    renderWelcome();
    const field = await balance();

    await user().clear(field);
    await user().type(field, "1250.50");
    await user().click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.getByText("Home screen")).toBeDefined());
    expect(patches).toEqual([
      {
        version: 1,
        timezone: "Asia/Kolkata",
        openingBalance: 125050,
        openingBalanceDate: "2026-11-24",
      },
    ]);
  });

  it("[FR-13.3] [FR-9.2] Continue accepts a negative opening balance", async () => {
    renderWelcome();
    const field = await balance();

    await user().clear(field);
    await user().type(field, "-500");
    await user().click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.getByText("Home screen")).toBeDefined());
    expect(patches[0]).toMatchObject({ openingBalance: -50000 });
  });

  it("[FR-13.3] Skip sends only the version and timezone, then lands on Home", async () => {
    renderWelcome();
    await balance();

    await user().click(screen.getByRole("button", { name: "Skip for now" }));

    await waitFor(() => expect(screen.getByText("Home screen")).toBeDefined());
    expect(patches).toEqual([{ version: 1, timezone: "Asia/Kolkata" }]);
  });
});

describe("WelcomePage when saving fails", () => {
  it("[FR-9.2] asks for an amount when the balance is empty, and doesn't save", async () => {
    renderWelcome();
    await user().clear(await balance());

    await user().click(screen.getByRole("button", { name: "Continue" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Enter an amount");
    expect(patches).toEqual([]);
  });

  it("[FR-9.3] shows the server's message under the date when it refuses it", async () => {
    patchReply = {
      status: 400,
      body: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          details: [{ field: "openingBalanceDate", message: "Date can't be in the future" }],
        },
      },
    };
    renderWelcome();
    await balance();

    await user().click(screen.getByRole("button", { name: "Continue" }));

    expect((await screen.findByText("Date can't be in the future")).getAttribute("role")).toBe(
      "alert",
    );
    expect(screen.queryByText("Home screen")).toBeNull();
  });

  it("[FR-9.8] shows the stale-edit message when the profile changed on another device", async () => {
    patchReply = {
      status: 409,
      body: {
        success: false,
        error: { code: "STALE_RECORD", message: ERROR_MESSAGES.STALE_RECORD },
      },
    };
    renderWelcome();
    await balance();

    await user().click(screen.getByRole("button", { name: "Skip for now" }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(ERROR_MESSAGES.STALE_RECORD, expect.anything());
    });
    expect(screen.queryByText("Home screen")).toBeNull();
  });
});
