import * as React from "react";
import { ResponsiveDrawer } from "@/components/ResponsiveDrawer.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import { cn } from "@/lib/utils.js";
import { EMOJI_GROUPS } from "./emoji-groups.js";

export function isExactlyOneEmoji(text: string): boolean {
  if (!text) return false;
  const segments = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)];
  if (segments.length !== 1) return false;
  const cp = text.codePointAt(0);
  if (cp === undefined) return false;
  return cp > 0x00ff;
}

interface EmojiGridProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

function EmojiGrid({ selected, onSelect }: EmojiGridProps) {
  return (
    <div className="max-h-72 overflow-y-auto space-y-4 py-2">
      {EMOJI_GROUPS.map((group) => (
        <section key={group.label}>
          <h3 className="text-caption font-medium text-text-muted px-1 mb-2">{group.label}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1">
            {group.emoji.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onSelect(e)}
                aria-label={e}
                aria-pressed={e === selected}
                className={cn(
                  "flex items-center justify-center rounded-md text-2xl",
                  "h-11 w-full min-w-[44px]",
                  "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  e === selected && "bg-primary-soft ring-2 ring-primary ring-offset-1",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface UseAnotherProps {
  onSelect: (emoji: string) => void;
}

function UseAnotherEmoji({ onSelect }: UseAnotherProps) {
  const inputId = React.useId();
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setError("");
  }

  function handleConfirm() {
    const trimmed = inputValue.trim();
    if (!isExactlyOneEmoji(trimmed)) {
      setError("Enter exactly one emoji.");
      return;
    }
    onSelect(trimmed);
    setInputValue("");
  }

  return (
    <div className="border-t border-border pt-4 flex flex-col gap-1.5">
      <Label htmlFor={inputId}>Use another emoji</Label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={inputValue}
          onChange={handleChange}
          placeholder="Type or paste one emoji"
          aria-invalid={error ? true : undefined}
        />
        <Button type="button" variant="secondary" onClick={handleConfirm} disabled={!inputValue}>
          Use
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-caption text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

export interface EmojiPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (emoji: string) => void;
  triggerLabel?: string;
}

export function EmojiPicker({
  open,
  onOpenChange,
  value,
  onChange,
  triggerLabel = "Choose emoji",
}: EmojiPickerProps) {
  function handleSelect(emoji: string) {
    onChange(emoji);
    onOpenChange(false);
  }

  return (
    <ResponsiveDrawer open={open} onOpenChange={onOpenChange} title={triggerLabel}>
      <EmojiGrid selected={value} onSelect={handleSelect} />
      <UseAnotherEmoji onSelect={handleSelect} />
    </ResponsiveDrawer>
  );
}
