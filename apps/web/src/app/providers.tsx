import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "@/components/Toaster.js";
import { UpdatePrompt } from "@/components/UpdatePrompt.js";

// Separate file forces a Vite code-split boundary so the feature bundle stays
// out of the initial chunk (UI.md 6.1). A same-package dynamic import would
// be bundled together with the static LazyMotion/MotionConfig imports.
const loadMotionFeatures = async () => {
  const { features } = await import("../lib/motion-features.js");
  return features;
};

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

// Read the computed --background token so this never duplicates a hex value (UI.md 4.11).
function applyThemeColor() {
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor !== null) {
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    themeColor.setAttribute("content", bg);
  }
}

function ThemeWatcher() {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function handler(e: MediaQueryListEvent) {
      // Only follow the OS when the user has not set an explicit preference.
      if (localStorage.getItem("theme") === null) {
        document.documentElement.classList.toggle("dark", e.matches);
        applyThemeColor();
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
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <ThemeWatcher />
          {children}
        </MotionConfig>
      </LazyMotion>
      <Toaster />
      <UpdatePrompt />
    </QueryClientProvider>
  );
}
