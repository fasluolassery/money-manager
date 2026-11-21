import type * as React from "react";
import { FieldChrome, fieldAriaProps, useFieldIds } from "@/components/field-chrome.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";

type Shared = {
  label: string;
  error?: string;
  maxLength?: number;
  id?: string;
  value?: string | number | readonly string[];
  className?: string;
};

export type LabeledInputProps = Shared &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof Shared> & { control?: "input" };

export type LabeledTextareaProps = Shared &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof Shared> & {
    control: "textarea";
  };

/** Shared label / error / counter chrome for TextField and TextArea (UI.md 5.3). */
export function LabeledText(props: LabeledInputProps | LabeledTextareaProps) {
  const { label, error, maxLength, id, value, className, control = "input", ...rest } = props;
  const { fieldId } = useFieldIds(id);
  const length = typeof value === "string" ? value.length : 0;
  const aria = fieldAriaProps(fieldId, error, maxLength);

  return (
    <FieldChrome
      label={label}
      fieldId={fieldId}
      error={error}
      maxLength={maxLength}
      length={length}
      className={className}
    >
      {control === "textarea" ? (
        <Textarea
          id={fieldId}
          value={value}
          maxLength={maxLength}
          {...aria}
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <Input
          id={fieldId}
          value={value}
          maxLength={maxLength}
          {...aria}
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
    </FieldChrome>
  );
}
