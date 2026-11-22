import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";
import { duration, easing } from "@/lib/motion.js";
import { cn } from "@/lib/utils.js";

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary-soft", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-transform"
      style={{
        transform: `translateX(-${100 - (value ?? 0)}%)`,
        transitionDuration: `${duration.slow}s`,
        transitionTimingFunction: `cubic-bezier(${easing.enter.join(",")})`,
      }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
