import { Plus } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { Outlet, useLocation, useMatches } from "react-router";
import { OfflineBanner } from "@/components/OfflineBanner.js";
import { detailSlideIn, tabCrossFade } from "@/lib/motion.js";
import { useMediaQuery } from "@/lib/use-media-query.js";
import { AddTransactionDrawer } from "./AddTransactionDrawer.js";
import { BottomNav } from "./BottomNav.js";
import { Sidebar } from "./Sidebar.js";
import { TopBar } from "./TopBar.js";

function AnimatedOutlet() {
  const location = useLocation();
  const matches = useMatches();
  const isDetail = matches.some((m) => Object.keys(m.params).length > 0);
  const variants = isDetail ? detailSlideIn : tabCrossFade;

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={location.pathname}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="h-full"
      >
        <Outlet />
      </m.div>
    </AnimatePresence>
  );
}

export function AppShell() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isDesktop) {
    return (
      <div className="flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar onAdd={() => setDrawerOpen(true)} />
          <OfflineBanner />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1120px] px-4 py-6">
              <AnimatedOutlet />
            </div>
          </main>
        </div>
        <AddTransactionDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto pb-16 pb-safe">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-4">
          <AnimatedOutlet />
        </div>
      </main>
      <BottomNav />
      <button
        type="button"
        aria-label="Add transaction"
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.97] motion-reduce:active:scale-100"
      >
        <Plus className="icon-nav" aria-hidden />
      </button>
      <AddTransactionDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
