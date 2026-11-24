// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import SignInPage from "./SignInPage.js";

const signInSocial = vi.fn();

vi.mock("@/lib/auth-client.js", () => ({
  authClient: {
    signIn: { social: (...args: unknown[]) => signInSocial(...args) },
  },
  SIGN_IN_FAILED_MESSAGE: "Couldn't sign you in. Try again.",
}));

afterEach(() => {
  vi.restoreAllMocks();
  signInSocial.mockReset();
});

function renderSignIn(path = "/sign-in") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => null }));
  const router = createMemoryRouter([{ path: "/sign-in", element: <SignInPage /> }], {
    initialEntries: [path],
  });
  function wrap({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return render(<RouterProvider router={router} />, { wrapper: wrap });
}

describe("SignInPage", () => {
  it("[FR-2.3] shows the tagline and Continue with Google", async () => {
    renderSignIn();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDefined();
    });
    expect(screen.getByText("Know exactly where your money goes.")).toBeDefined();
  });

  it("[FR-2.3] starts Google sign-in with the from path as callbackURL", async () => {
    signInSocial.mockResolvedValue({ data: null, error: null });
    const user = userEvent.setup();
    renderSignIn("/sign-in?from=%2Freports");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDefined();
    });
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => {
      expect(signInSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "google",
          callbackURL: "/reports",
        }),
      );
    });
  });
});
