import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});

const THEME_COLOR_LIGHT = "#FAF9FC";
const THEME_COLOR_DARK = "#1C1B1F";

function applyThemeColor(dark: boolean) {
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor !== null) {
    themeColor.setAttribute("content", dark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
  }
}

function ThemeWatcher() {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function handler(e: MediaQueryListEvent) {
      // Only follow the OS when the user has not set an explicit preference.
      if (localStorage.getItem("theme") === null) {
        document.documentElement.classList.toggle("dark", e.matches);
        applyThemeColor(e.matches);
      }
    }
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeWatcher />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
