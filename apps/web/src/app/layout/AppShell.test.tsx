// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineBanner } from "@/components/OfflineBanner.js";
import { useMediaQuery } from "@/lib/use-media-query.js";
import { AppShell } from "./AppShell.js";
import { BottomNav } from "./BottomNav.js";
import { Sidebar } from "./Sidebar.js";

vi.mock("@/lib/use-media-query.js", () => ({ useMediaQuery: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
});

function withRouter(element: ReactNode, path = "/") {
  const r = createMemoryRouter([{ path: "*", element: <>{element}</> }], {
    initialEntries: [path],
  });
  return (
    <LazyMotion features={domAnimation}>
      <RouterProvider router={r} />
    </LazyMotion>
  );
}

function renderAppShell(isDesktop: boolean, path = "/") {
  vi.mocked(useMediaQuery).mockReturnValue(isDesktop);
  const r = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [{ path: "*", element: <div>Content</div> }],
      },
    ],
    { initialEntries: [path] },
  );
  return render(
    <LazyMotion features={domAnimation}>
      <RouterProvider router={r} />
    </LazyMotion>,
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

describe("BottomNav", () => {
  it("[FR-12.1] renders all five navigation sections", () => {
    vi.mocked(useMediaQuery).mockReturnValue(false);
    render(withRouter(<BottomNav />));
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Transactions")).toBeDefined();
    expect(screen.getByText("Reports")).toBeDefined();
    expect(screen.getByText("Plan")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("[FR-12.1] marks the active section with aria-current=page", () => {
    vi.mocked(useMediaQuery).mockReturnValue(false);
    render(withRouter(<BottomNav />, "/reports"));
    const link = screen.getByText("Reports").closest("a");
    expect(link?.getAttribute("aria-current")).toBe("page");
  });

  it("[FR-12.1] does not mark an inactive section as current", () => {
    vi.mocked(useMediaQuery).mockReturnValue(false);
    render(withRouter(<BottomNav />, "/reports"));
    const link = screen.getByText("Home").closest("a");
    expect(link?.getAttribute("aria-current")).toBeNull();
  });

  it("[FR-12.1] marks Plan active for any /plan/* path", () => {
    vi.mocked(useMediaQuery).mockReturnValue(false);
    render(withRouter(<BottomNav />, "/plan/goals"));
    const link = screen.getByText("Plan").closest("a");
    expect(link?.getAttribute("aria-current")).toBe("page");
  });
});

// ─── Sidebar ─────────────────────────────────────────────────────────────────

describe("Sidebar", () => {
  it("[FR-12.1] renders all five navigation sections", () => {
    vi.mocked(useMediaQuery).mockReturnValue(true);
    render(withRouter(<Sidebar />));
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Transactions")).toBeDefined();
    expect(screen.getByText("Reports")).toBeDefined();
    expect(screen.getByText("Plan")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("[FR-12.1] marks the active section with aria-current=page", () => {
    vi.mocked(useMediaQuery).mockReturnValue(true);
    render(withRouter(<Sidebar />, "/transactions"));
    const link = screen.getByText("Transactions").closest("a");
    expect(link?.getAttribute("aria-current")).toBe("page");
  });
});

// ─── AppShell layouts (FR-3.2, FR-3.3, FR-4.6, FR-12.2) ─────────────────────

describe("AppShell phone layout", () => {
  it("[FR-3.2] [FR-4.6] [FR-12.2] phone layout: FAB is visible for fast one-hand add", () => {
    renderAppShell(false);
    expect(screen.getByRole("button", { name: /add transaction/i })).toBeDefined();
  });

  it("[FR-3.2] phone layout: bottom nav is visible", () => {
    renderAppShell(false);
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeDefined();
  });
});

describe("AppShell desktop layout", () => {
  it("[FR-3.3] [FR-4.6] [FR-12.2] desktop layout: sidebar and Add button in top bar are visible", () => {
    renderAppShell(true);
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /add/i })).toBeDefined();
  });
});

// ─── OfflineBanner (FR-3.8) ───────────────────────────────────────────────────

describe("OfflineBanner", () => {
  it("[FR-3.8] is hidden when online", () => {
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    render(withRouter(<OfflineBanner />));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("[FR-3.8] shows the offline message when the browser goes offline", () => {
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    render(withRouter(<OfflineBanner />));
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText("You're offline. Changes won't save until you're back.")).toBeDefined();
  });

  it("[FR-3.8] hides the banner when the browser comes back online", () => {
    vi.stubGlobal("navigator", { ...navigator, onLine: false });
    render(withRouter(<OfflineBanner />));
    expect(screen.getByRole("status")).toBeDefined();
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});
