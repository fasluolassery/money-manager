import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils.js";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97] motion-reduce:active:scale-100",
  ],
  {
    variants: {
      // size is listed first so variant classes (including fab) can win via tailwind-merge
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8",
        icon: "h-10 w-10",
      },
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-surface-muted text-text hover:bg-surface-muted/80",
        ghost: "text-text hover:bg-surface-muted",
        destructive: "bg-alert text-primary-foreground hover:bg-alert/90",
        "danger-ghost": "text-alert hover:bg-alert-soft",
        // `fixed` positioning is NOT here — the page that renders the FAB controls its placement.
        // Use size="icon" with this variant (no padding) so h-14 w-14 from fab wins.
        fab: "h-14 w-14 rounded-full shadow-fab bg-primary text-primary-foreground hover:bg-primary/90",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  busy?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, busy = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        // These must come after the spread so they are never overridden by callers
        disabled={busy || disabled}
        aria-busy={busy || undefined}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {/* Preserve the original label so AT announces "Loading, Save" not just "Loading" */}
            <span className="sr-only">Loading, {children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
