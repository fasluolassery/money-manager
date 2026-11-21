import { createBrowserRouter } from "react-router";

/**
 * All top-level routes are lazy-loaded (DESIGN 8.10).
 * React Router's `lazy` splits each route into its own chunk at build time.
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
    path: "/",
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
    path: "/reports",
    lazy: async () => {
      const { default: Component } = await import("../pages/ReportsPage.js");
      return { Component };
    },
  },
  {
    path: "/settings",
    lazy: async () => {
      const { default: Component } = await import("../pages/SettingsPage.js");
      return { Component };
    },
  },
  {
    path: "*",
    lazy: async () => {
      const { default: Component } = await import("../pages/NotFoundPage.js");
      return { Component };
    },
  },
]);
