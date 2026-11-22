import { useEffect } from "react";
import { toast } from "sonner";
import { initServiceWorker } from "@/lib/register-sw.js";

/** Registers the service worker and shows a toast when a new version is ready (DESIGN 8.7, UI.md 9.3). */
export function UpdatePrompt() {
  useEffect(() => {
    initServiceWorker(() => {
      toast("A new version is ready.", {
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => window.location.reload(),
        },
      });
    });
  }, []);

  return null;
}
