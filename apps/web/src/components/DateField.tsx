import { format, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button.js";
import { Calendar } from "@/components/ui/calendar.js";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.js";

export interface DateFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disableFuture?: boolean;
  error?: string;
  disabled?: boolean;
  id?: string;
}

export function DateField({
  label,
  value,
  onChange,
  disableFuture = false,
  error,
  disabled,
  id,
}: DateFieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = subDays(today, 1);

  const isToday =
    value !== undefined && format(value, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  const isYesterday =
    value !== undefined && format(value, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd");

  return (
    <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0 min-w-0">
      <legend className="text-label font-medium text-text leading-none float-left w-full mb-1.5">
        {label}
      </legend>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant={isToday ? "secondary" : "ghost"}
          size="sm"
          disabled={disabled}
          onClick={() => onChange(today)}
          aria-pressed={isToday}
        >
          Today
        </Button>
        <Button
          type="button"
          variant={isYesterday ? "secondary" : "ghost"}
          size="sm"
          disabled={disabled}
          onClick={() => onChange(yesterday)}
          aria-pressed={isYesterday}
        >
          Yesterday
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={!isToday && !isYesterday && value ? "secondary" : "ghost"}
              size="sm"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={undefined}
            >
              <CalendarIcon className="h-4 w-4 mr-1" aria-hidden />
              {!isToday && !isYesterday && value ? format(value, "d MMM yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={onChange}
              disabled={disableFuture ? { after: today } : undefined}
              defaultMonth={value ?? today}
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-caption text-alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
