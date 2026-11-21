import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Autocomplete } from "@/components/Autocomplete.js";
import { DateField } from "@/components/DateField.js";
import { EmojiPicker } from "@/components/emoji-picker/index.js";
import { ProgressBar } from "@/components/ProgressBar.js";
import { SegmentedControl } from "@/components/SegmentedControl.js";
import { TextArea } from "@/components/TextArea.js";
import { TextField } from "@/components/TextField.js";
import { Button } from "@/components/ui/button.js";

const PAYEE_OPTIONS = [
  { value: "swiggy", label: "Swiggy" },
  { value: "zomato", label: "Zomato" },
  { value: "amazon", label: "Amazon" },
  { value: "netflix", label: "Netflix" },
];

export function TextFieldsSection() {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  return (
    <section>
      <h2 className="text-heading mb-4">TextField + TextArea (UI.md 5.3)</h2>
      <div className="space-y-4 max-w-sm">
        <TextField
          label="Payee"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Swiggy"
          maxLength={100}
        />
        <TextField
          label="With error"
          value=""
          onChange={() => {}}
          error="This field is required."
        />
        <TextField label="Disabled" value="Swiggy" onChange={() => {}} disabled />
        <TextArea
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          maxLength={500}
        />
        <TextArea label="Disabled" value="Some note" onChange={() => {}} disabled />
      </div>
    </section>
  );
}

type DemoFormValues = { payee: string; date: Date | undefined; type: string };

export function RhfFormSection() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DemoFormValues>({
    mode: "onBlur",
    defaultValues: { payee: "", date: new Date(), type: "expense" },
  });
  function onSubmit(data: DemoFormValues) {
    toast.success(`Saved: ${data.payee || "(no payee)"}`);
  }
  return (
    <section>
      <h2 className="text-heading mb-4">React Hook Form integration (UI.md 7.3)</h2>
      <p className="text-caption text-text-muted mb-4">
        Leave Payee empty and blur — error appears on blur, not while typing.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 max-w-sm">
        <Controller
          name="payee"
          control={control}
          rules={{ required: "Payee is required." }}
          render={({ field }) => (
            <TextField
              label="Payee"
              {...field}
              error={errors.payee?.message}
              placeholder="e.g. Swiggy"
              maxLength={100}
            />
          )}
        />
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              label="Type"
              options={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DateField label="Date" value={field.value} onChange={field.onChange} disableFuture />
          )}
        />
        <Button type="submit" variant="primary">
          Save
        </Button>
      </form>
    </section>
  );
}

export function DateAutoSection() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [payee, setPayee] = useState("");
  return (
    <section>
      <h2 className="text-heading mb-4">DateField + Autocomplete (UI.md 5.3)</h2>
      <div className="space-y-4 max-w-sm">
        <DateField
          label="Transaction date (no future)"
          value={date}
          onChange={setDate}
          disableFuture
        />
        <DateField label="Due date (future allowed)" value={date} onChange={setDate} />
        <DateField label="Disabled" value={date} onChange={setDate} disabled />
        <Autocomplete
          label="Payee"
          options={PAYEE_OPTIONS}
          value={payee}
          onChange={setPayee}
          placeholder="Search payees…"
          emptyText="No payees yet."
        />
        <Autocomplete
          label="Payee (error)"
          options={PAYEE_OPTIONS}
          value=""
          onChange={() => {}}
          placeholder="Search payees…"
          emptyText="No payees yet."
          error="Payee is required."
        />
        <Autocomplete
          label="Payee (disabled)"
          options={PAYEE_OPTIONS}
          value="swiggy"
          onChange={() => {}}
          disabled
        />
      </div>
    </section>
  );
}

export function SegmentedProgressSection() {
  const [type, setType] = useState("expense");
  return (
    <section>
      <h2 className="text-heading mb-4">SegmentedControl + ProgressBar (UI.md 5.3)</h2>
      <div className="space-y-4 max-w-sm">
        <SegmentedControl
          label="Type"
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
          value={type}
          onChange={setType}
        />
        <SegmentedControl
          label="Lending"
          options={[
            { value: "lent", label: "I lent" },
            { value: "borrowed", label: "I borrowed" },
          ]}
          value="lent"
          onChange={() => {}}
        />
        <SegmentedControl
          label="Disabled"
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
          value="expense"
          onChange={() => {}}
          disabled
        />
        <ProgressBar percent={65} className="mt-6" />
        <ProgressBar percent={24} label="₹12,000 of ₹50,000" />
      </div>
    </section>
  );
}

export function EmojiSection() {
  const [emoji, setEmoji] = useState("🍕");
  const [open, setOpen] = useState(false);
  return (
    <section>
      <h2 className="text-heading mb-4">EmojiPicker (UI.md 5.4)</h2>
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <span className="text-heading mr-2">{emoji}</span>
          Change emoji
        </Button>
        <span className="text-label text-text-muted">Selected: {emoji}</span>
      </div>
      <EmojiPicker open={open} onOpenChange={setOpen} value={emoji} onChange={setEmoji} />
    </section>
  );
}
