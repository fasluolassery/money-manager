import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils.js";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarChevron({ orientation }: { orientation?: string }) {
  return orientation === "left" ? (
    <ChevronLeft className="h-4 w-4" aria-hidden />
  ) : (
    <ChevronRight className="h-4 w-4" aria-hidden />
  );
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-label font-medium text-text",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 h-7 w-7 bg-transparent p-0 text-text-muted opacity-50 hover:opacity-100",
          "inline-flex items-center justify-center rounded-md hover:bg-surface-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        ),
        button_next: cn(
          "absolute right-1 h-7 w-7 bg-transparent p-0 text-text-muted opacity-50 hover:opacity-100",
          "inline-flex items-center justify-center rounded-md hover:bg-surface-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-text-muted rounded-md w-9 font-normal text-caption",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-label",
        day_button: cn(
          "h-9 w-9 p-0 font-normal inline-flex items-center justify-center rounded-md text-text",
          "hover:bg-primary-soft hover:text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          "aria-selected:opacity-100",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary [&>button]:hover:text-white",
        today: "[&>button]:bg-surface-muted [&>button]:font-semibold",
        outside: "[&>button]:text-text-muted [&>button]:opacity-50",
        disabled: "[&>button]:text-text-muted [&>button]:opacity-50 [&>button]:pointer-events-none",
        range_middle: "[&>button]:bg-primary-soft [&>button]:text-text [&>button]:rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
