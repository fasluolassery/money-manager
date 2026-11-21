import * as React from "react";
import { Label } from "@/components/ui/label.js";
import { Textarea } from "@/components/ui/textarea.js";
import { cn } from "@/lib/utils.js";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  maxLength?: number;
}

export function TextArea({
  label,
  error,
  maxLength,
  id,
  value,
  className,
  ...props
}: TextAreaProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const counterId = `${fieldId}-counter`;
  const length = typeof value === "string" ? value.length : 0;
  const nearLimit = maxLength !== undefined && length >= maxLength * 0.9;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Textarea
        id={fieldId}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error ? errorId : "", maxLength ? counterId : "") || undefined}
        {...props}
      />
      <div className="flex items-start justify-between gap-2">
        {error && (
          <p id={errorId} role="alert" className="text-caption text-alert">
            {error}
          </p>
        )}
        {maxLength !== undefined && (
          <p
            id={counterId}
            className={cn(
              "ml-auto text-caption",
              nearLimit ? "text-alert" : "text-text-muted",
              !nearLimit && !error && "invisible",
            )}
            aria-live="polite"
          >
            {length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
