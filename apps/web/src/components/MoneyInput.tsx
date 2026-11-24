import {
  formatRupeesInput,
  groupRupeesInput,
  type Paise,
  parseSignedRupees,
} from "@money-manager/shared";
import * as React from "react";
import { FieldChrome, fieldAriaProps, useFieldIds } from "@/components/field-chrome.js";
import { Input } from "@/components/ui/input.js";

export interface MoneyInputProps {
  label: string;
  /** The amount in paise, or null while the field is empty. */
  value: Paise | null;
  onChange: (value: Paise | null) => void;
  /** Only the opening balance may be negative (Spec Rule 9). */
  allowNegative?: boolean;
  error?: string;
  disabled?: boolean;
  id?: string;
}

const UNSIGNED_TEXT = /^\d*(\.\d{0,2})?$/;
const SIGNED_TEXT = /^-?\d*(\.\d{0,2})?$/;

/** What was typed without grouping commas, or null when it can't be part of an amount. */
function cleanTyped(raw: string, allowNegative: boolean): string | null {
  const plain = raw.replaceAll(",", "").replaceAll(" ", "").replace("\u2212", "-");
  return (allowNegative ? SIGNED_TEXT : UNSIGNED_TEXT).test(plain) ? plain : null;
}

/** "5." and ".5" are partial amounts: read them as 5 and 0.5; "" and "-" are empty. */
function parseTyped(plain: string): Paise | null {
  const whole = plain.replace(/^(-?)\./, (_, sign: string) => `${sign}0.`).replace(/\.$/, "");
  return whole === "" || whole === "-" ? null : parseSignedRupees(whole);
}

const significantCount = (text: string) => text.replaceAll(",", "").length;

/** The caret position in `text` that follows `count` characters other than commas. */
function caretFor(text: string, count: number): number {
  let seen = 0;
  for (let position = 0; position < text.length; position++) {
    if (seen === count) return position;
    if (text[position] !== ",") seen++;
  }
  return text.length;
}

/**
 * Money field (UI.md 5.3, DESIGN 8.5): ₹ prefix, number keypad on phones, Indian grouping
 * shown as you type. The form gets paise (`Paise | null`), never the text. Typing stops at
 * ₹1,00,00,000 and at 2 decimals, so every value it reports is valid.
 */
export function MoneyInput({
  label,
  value,
  onChange,
  allowNegative = false,
  error,
  disabled,
  id,
}: MoneyInputProps) {
  const { fieldId } = useFieldIds(id);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const caret = React.useRef<number | null>(null);
  const [text, setText] = React.useState(() => (value === null ? "" : formatRupeesInput(value)));

  // Show a value the form changed from outside (a reset, a refetch); never rewrite what is typed.
  React.useEffect(() => {
    const typed = cleanTyped(text, true);
    if (typed === null || parseTyped(typed) !== value) {
      setText(value === null ? "" : formatRupeesInput(value));
    }
  }, [text, value]);

  // Keep the caret where the typing was, after commas were added or removed.
  React.useLayoutEffect(() => {
    if (caret.current === null || inputRef.current === null) return;
    const position = caretFor(text, caret.current);
    inputRef.current.setSelectionRange(position, position);
    caret.current = null;
  }, [text]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    const plain = cleanTyped(raw, allowNegative);
    if (plain === null) return;
    const amount = parseTyped(plain);
    if (amount === null && plain.replace("-", "") !== "") return; // beyond ±₹1,00,00,000
    caret.current = significantCount(raw.slice(0, event.target.selectionStart ?? raw.length));
    setText(groupRupeesInput(plain));
    onChange(amount);
  }

  return (
    <FieldChrome label={label} fieldId={fieldId} error={error}>
      <div className="relative">
        <span
          aria-hidden
          className="text-body text-text-muted pointer-events-none absolute inset-y-0 left-3 flex items-center"
        >
          ₹
        </span>
        <Input
          ref={inputRef}
          id={fieldId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          className="pl-8 tabular-nums"
          disabled={disabled}
          value={text}
          onChange={handleChange}
          {...fieldAriaProps(fieldId, error, undefined)}
        />
      </div>
    </FieldChrome>
  );
}
