// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "./BottomNav.js";
import { Sidebar } from "./Sidebar.js";

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

// ─── BottomNav ────────────────────────────────────────────────────────────────

describe("BottomNav", () => {
  it("[FR-12.1] renders all five navigation sections", () => {
    render(withRouter(<BottomNav />));
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Transactions")).toBeDefined();
    expect(screen.getByText("Reports")).toBeDefined();
    expect(screen.getByText("Plan")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("[FR-12.1] marks the active section with aria-current=page", () => {
    render(withRouter(<BottomNav />, "/reports"));
    const link = screen.getByText("Reports").closest("a");
    expect(link?.getAttribute("aria-current")).toBe("page");
  });

  it("[FR-12.1] does not mark an inactive section as current", () => {
    render(withRouter(<BottomNav />, "/reports"));
    const link = screen.getByText("Home").closest("a");
    expect(link?.getAttribute("aria-current")).toBeNull();
  });

  it("[FR-12.1] marks Plan active for any /plan/* path", () => {
    render(withRouter(<BottomNav />, "/plan/goals"));
    const link = screen.getByText("Plan").closest("a");
    expect(link?.getAttribute("aria-current")).toBe("page");
  });
});

// ─── Sidebar ─────────────────────────────────────────────────────────────────

describe("Sidebar", () => {
  it("[FR-12.1] renders all five navigation sections", () => {
    render(withRouter(<Sidebar />));
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Transactions")).toBeDefined();
    expect(screen.getByText("Reports")).toBeDefined();
    expect(screen.getByText("Plan")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("[FR-12.1] marks the active section with aria-current=page", () => {
    render(withRouter(<Sidebar />, "/transactions"));
    const link = screen.getByText("Transactions").closest("a");
    expect(link?.getAttribute("aria-current")).toBe("page");
  });
});

// ─── Add button (FR-12.2) ─────────────────────────────────────────────────────

describe("Add button", () => {
  it("[FR-12.2] BottomNav does not contain the Add button (FAB is in AppShell)", () => {
    render(withRouter(<BottomNav />));
    expect(screen.queryByRole("button", { name: /add transaction/i })).toBeNull();
  });
});

// ─── OfflineBanner (FR-3.8) ───────────────────────────────────────────────────

import { OfflineBanner } from "@/components/OfflineBanner.js";

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
