import { Check } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button.js";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.js";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.js";
import { cn } from "@/lib/utils.js";
import { listTimezones } from "../timezones.js";

export interface TimezonePickerProps {
  value: string;
  onChange: (timezone: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * "Timezone: Asia/Kolkata [Change]" with a searchable list (UI.md 3.9, 5.5): Command inside
 * a Popover, the same pair every searchable list uses.
 */
export function TimezonePicker({ value, onChange, error, disabled }: TimezonePickerProps) {
  const [open, setOpen] = React.useState(false);
  const zones = React.useMemo(() => listTimezones(value), [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-body text-text">
          <span className="text-text-muted">Timezone: </span>
          <span>{value}</span>
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" disabled={disabled}>
              Change
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0">
            <Command label="Search timezones">
              <CommandInput placeholder="Search timezones…" />
              <CommandList>
                <CommandEmpty>No timezone found.</CommandEmpty>
                <CommandGroup>
                  {zones.map((zone) => (
                    <CommandItem
                      key={zone}
                      value={zone}
                      onSelect={() => {
                        onChange(zone);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", zone === value ? "opacity-100" : "opacity-0")}
                        aria-hidden
                      />
                      {zone}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {error ? (
        <p role="alert" className="text-caption text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
