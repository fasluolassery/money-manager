// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "./RequireAuth.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function renderGuarded(initialPath: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/sign-in",
        element: <div>Sign-in screen</div>,
      },
      {
        element: <RequireAuth />,
        children: [{ path: "/", element: <div>Home screen</div> }],
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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => null }));
    renderGuarded("/");
    await waitFor(() => {
      expect(screen.getByText("Sign-in screen")).toBeDefined();
    });
  });

  it("[FR-2.3] lets a signed-in user through to the requested route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { id: "u1", name: "Save", email: "save@example.com" },
          session: { id: "s1", expiresAt: new Date().toISOString() },
        }),
      }),
    );
    renderGuarded("/");
    await waitFor(() => {
      expect(screen.getByText("Home screen")).toBeDefined();
    });
  });
});
