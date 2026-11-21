import { Toaster as Sonner } from "sonner";

/**
 * Sonner toast container configured per UI.md 7.2:
 * - Bottom-right on laptops; above the tab bar on phones (bottom + 72px)
 * - One toast at a time (richColors + expand=false)
 * - Durations managed per-toast via toast() calls (4s default, 6s with action)
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "text-body font-sans bg-surface border border-border text-text shadow-card rounded-[var(--radius-md)]",
          actionButton: "text-primary font-medium",
          cancelButton: "text-text-muted",
        },
      }}
      className="max-sm:bottom-20"
    />
  );
}
