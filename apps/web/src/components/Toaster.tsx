import { Toaster as Sonner } from "sonner";

/**
 * Sonner toast container configured per UI.md 7.2:
 * - Bottom-right on laptops; above the tab bar on phones (bottom + 72px)
 * - One toast at a time (visibleToasts=1)
 * - 4s default; 6s when the toast has an action — callers set duration via toast()
 * - Errors stay until dismissed — callers pass duration: Infinity for error toasts
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      expand={false}
      visibleToasts={1}
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
