import * as React from "react";
import { Label } from "@/components/ui/label.js";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.js";
import { cn } from "@/lib/utils.js";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  label: string;
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  disabled,
  id,
  className,
}: SegmentedControlProps) {
  const generatedId = React.useId();
  const groupId = id ?? generatedId;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label id={`${groupId}-label`}>{label}</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
        aria-labelledby={`${groupId}-label`}
        disabled={disabled}
        className="w-full"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="flex-1">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
