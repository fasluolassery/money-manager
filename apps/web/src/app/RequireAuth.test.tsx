// @vitest-environment jsdom
import type { MeResponse } from "@money-manager/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "./RequireAuth.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const SESSION = {
  user: { id: "u1", name: "Save", email: "save@example.com" },
  session: { id: "s1", expiresAt: new Date().toISOString() },
};

function profile(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    name: "Save",
    email: "save@example.com",
    timezone: "Asia/Kolkata",
    openingBalance: 0 as MeResponse["openingBalance"],
    openingBalanceDate: "2026-11-24" as MeResponse["openingBalanceDate"],
    currency: "INR",
    lastBackupAt: null,
    onboardedAt: "2026-11-24T10:00:00.000Z",
    version: 2,
    ...overrides,
  };
}

/** Better Auth's session endpoint and `GET /me`, by URL; `session: null` means signed out. */
function stubApi(session: unknown, me: MeResponse = profile()) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/auth/get-session") return { ok: true, json: async () => session };
      if (url === "/api/v1/me") {
        return { ok: true, status: 200, json: async () => ({ success: true, data: me }) };
      }
      throw new Error(`unexpected request to ${url}`);
    }),
  );
}

function renderGuarded(initialPath: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: "/sign-in", element: <div>Sign-in screen</div> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/", element: <div>Home screen</div> },
          { path: "/welcome", element: <div>Welcome screen</div> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );
  function wrap({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return render(<RouterProvider router={router} />, { wrapper: wrap });
}

describe("RequireAuth", () => {
  it("[FR-2.3] sends a signed-out visit to / to /sign-in", async () => {
    stubApi(null);
    renderGuarded("/");
    await waitFor(() => {
      expect(screen.getByText("Sign-in screen")).toBeDefined();
    });
  });

  it("[FR-2.3] lets a signed-in, onboarded user through to the requested route", async () => {
    stubApi(SESSION);
    renderGuarded("/");
    await waitFor(() => {
      expect(screen.getByText("Home screen")).toBeDefined();
    });
  });
});

describe("onboarding guard", () => {
  it("[FR-13.4] sends a signed-in user who hasn't finished the welcome screen to /welcome", async () => {
    stubApi(SESSION, profile({ onboardedAt: null, version: 1 }));
    renderGuarded("/");
    await waitFor(() => {
      expect(screen.getByText("Welcome screen")).toBeDefined();
    });
  });

  it("[FR-13.4] keeps an un-onboarded user on /welcome", async () => {
    stubApi(SESSION, profile({ onboardedAt: null, version: 1 }));
    renderGuarded("/welcome");
    await waitFor(() => {
      expect(screen.getByText("Welcome screen")).toBeDefined();
    });
  });

  it("[FR-13.4] never shows /welcome again once the user has finished or skipped it", async () => {
    stubApi(SESSION, profile());
    renderGuarded("/welcome");
    await waitFor(() => {
      expect(screen.getByText("Home screen")).toBeDefined();
    });
  });

  it("[FR-2.3] sends a signed-out visit to /welcome to /sign-in, not to the welcome screen", async () => {
    stubApi(null);
    renderGuarded("/welcome");
    await waitFor(() => {
      expect(screen.getByText("Sign-in screen")).toBeDefined();
    });
  });

  it("[FR-13.4] offers Retry when the profile can't be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/auth/get-session") return { ok: true, json: async () => SESSION };
        throw new TypeError("offline");
      }),
    );
    renderGuarded("/");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
    });
  });
});
