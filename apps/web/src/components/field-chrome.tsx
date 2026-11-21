import * as React from "react";
import { Label } from "@/components/ui/label.js";
import { cn } from "@/lib/utils.js";

/** Stable ids for a labelled field, its error, and its character counter. */
export function useFieldIds(id?: string) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  return {
    fieldId,
    errorId: `${fieldId}-error`,
    counterId: `${fieldId}-counter`,
  };
}

/** `aria-invalid` / `aria-describedby` shared by TextField and TextArea. */
export function fieldAriaProps(
  fieldId: string,
  error: string | undefined,
  maxLength: number | undefined,
) {
  const describedBy = [
    error ? `${fieldId}-error` : "",
    maxLength !== undefined ? `${fieldId}-counter` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy || undefined,
  };
}

interface FieldChromeProps {
  label: string;
  fieldId: string;
  error?: string;
  maxLength?: number;
  length?: number;
  className?: string;
  children: React.ReactNode;
}

/** Label + control slot + error / near-limit counter (UI.md 5.3). */
export function FieldChrome({
  label,
  fieldId,
  error,
  maxLength,
  length = 0,
  className,
  children,
}: FieldChromeProps) {
  const nearLimit = maxLength !== undefined && length >= maxLength * 0.9;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      {children}
      <div className="flex items-start justify-between gap-2">
        {error ? (
          <p id={`${fieldId}-error`} role="alert" className="text-caption text-alert">
            {error}
          </p>
        ) : null}
        {maxLength !== undefined ? (
          <p
            id={`${fieldId}-counter`}
            className={cn(
              "ml-auto text-caption",
              nearLimit ? "text-alert" : "text-text-muted",
              !nearLimit && !error && "invisible",
            )}
            aria-live="polite"
          >
            {length}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
}
