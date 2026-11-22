import { Check } from "lucide-react";
import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command.js";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover.js";
import { cn } from "@/lib/utils.js";

export interface AutocompleteOption {
  value: string;
  label: string;
}

export interface AutocompleteProps {
  label: string;
  options: AutocompleteOption[];
  /** Free-text value; suggestions fill this, but any typed string is allowed (FR-4.13). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
}

function filterOptions(options: AutocompleteOption[], value: string) {
  const query = value.trim().toLowerCase();
  return options.filter(
    (o) => o.label.toLowerCase().includes(query) || o.value.toLowerCase().includes(query),
  );
}

function SuggestionList({
  options,
  value,
  emptyText,
  onSelect,
}: {
  options: AutocompleteOption[];
  value: string;
  emptyText: string;
  onSelect: (option: AutocompleteOption) => void;
}) {
  return (
    <Command shouldFilter={false}>
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const selected = value === option.label || value === option.value;
            return (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => onSelect(option)}
              >
                <Check
                  className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")}
                  aria-hidden
                />
                {option.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function FreeTextInput({
  fieldId,
  listId,
  errorId,
  open,
  value,
  placeholder,
  error,
  disabled,
  onChange,
  onOpen,
  onEscape,
}: {
  fieldId: string;
  listId: string;
  errorId: string;
  open: boolean;
  value: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onOpen: () => void;
  onEscape: () => void;
}) {
  return (
    <Input
      id={fieldId}
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      onChange={(e) => {
        onChange(e.target.value);
        onOpen();
      }}
      onFocus={() => {
        if (!disabled) onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onEscape();
      }}
    />
  );
}

export function Autocomplete({
  label,
  options,
  value,
  onChange,
  placeholder = "Search…",
  emptyText = "No results.",
  error,
  disabled,
  id,
}: AutocompleteProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const listId = `${fieldId}-list`;
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <FreeTextInput
            fieldId={fieldId}
            listId={listId}
            errorId={errorId}
            open={open}
            value={value}
            placeholder={placeholder}
            error={error}
            disabled={disabled}
            onChange={onChange}
            onOpen={() => setOpen(true)}
            onEscape={() => setOpen(false)}
          />
        </PopoverAnchor>
        <PopoverContent
          id={listId}
          role="listbox"
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <SuggestionList
            options={filterOptions(options, value)}
            value={value}
            emptyText={emptyText}
            onSelect={(option) => {
              onChange(option.label);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
