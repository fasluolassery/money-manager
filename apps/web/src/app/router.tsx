import { createBrowserRouter, Navigate } from "react-router";
import { ErrorBoundaryPage } from "./ErrorBoundaryPage.js";
import { AppShell } from "./layout/AppShell.js";
import { PlanLayout } from "./layout/PlanLayout.js";

/**
 * All leaf routes are lazy-loaded (DESIGN 8.10).
 * AppShell, ErrorBoundaryPage, and PlanLayout are eager — they're shared by every route.
 */
export const router = createBrowserRouter([
  {
    path: "/sign-in",
    lazy: async () => {
      const { default: Component } = await import("../pages/SignInPage.js");
      return { Component };
    },
  },
  {
    path: "/welcome",
    lazy: async () => {
      const { default: Component } = await import("../pages/WelcomePage.js");
      return { Component };
    },
  },
  {
    element: <AppShell />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Component } = await import("../pages/HomePage.js");
          return { Component };
        },
      },
      {
        path: "/transactions",
        lazy: async () => {
          const { default: Component } = await import("../pages/TransactionsPage.js");
          return { Component };
        },
      },
      {
        path: "/transactions/trash",
        lazy: async () => {
          const { default: Component } = await import(
            "../pages/transactions/TransactionsTrashPage.js"
          );
          return { Component };
        },
      },
      {
        path: "/reports",
        lazy: async () => {
          const { default: Component } = await import("../pages/ReportsPage.js");
          return { Component };
        },
      },
      {
        path: "/plan",
        element: <PlanLayout />,
        children: [
          { index: true, element: <Navigate to="/plan/bills" replace /> },
          {
            path: "bills",
            lazy: async () => {
              const { default: Component } = await import("../pages/plan/PlanBillsPage.js");
              return { Component };
            },
          },
          {
            path: "bills/:id",
            lazy: async () => {
              const { default: Component } = await import("../pages/plan/PlanBillDetailPage.js");
              return { Component };
            },
          },
          {
            path: "goals",
            lazy: async () => {
              const { default: Component } = await import("../pages/plan/PlanGoalsPage.js");
              return { Component };
            },
          },
          {
            path: "goals/:id",
            lazy: async () => {
              const { default: Component } = await import("../pages/plan/PlanGoalDetailPage.js");
              return { Component };
            },
          },
          {
            path: "lending",
            lazy: async () => {
              const { default: Component } = await import("../pages/plan/PlanLendingPage.js");
              return { Component };
            },
          },
          {
            path: "lending/:id",
            lazy: async () => {
              const { default: Component } = await import("../pages/plan/PlanLendingDetailPage.js");
              return { Component };
            },
          },
        ],
      },
      {
        path: "/settings",
        lazy: async () => {
          const { default: Component } = await import("../pages/SettingsPage.js");
          return { Component };
        },
      },
      {
        path: "/settings/categories",
        lazy: async () => {
          const { default: Component } = await import(
            "../pages/settings/SettingsCategoriesPage.js"
          );
          return { Component };
        },
      },
    ],
  },
  {
    path: "*",
    lazy: async () => {
      const { default: Component } = await import("../pages/NotFoundPage.js");
      return { Component };
    },
  },
  // /dev/ui is tree-shaken out of production builds (import.meta.env.DEV = false).
  ...(import.meta.env.DEV
    ? [
        {
          path: "/dev/ui",
          lazy: async () => {
            const { default: Component } = await import("../pages/dev/DevUiPage.js");
            return { Component };
          },
        },
      ]
    : []),
]);
