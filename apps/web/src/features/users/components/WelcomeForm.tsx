import type { MeResponse } from "@money-manager/shared";
import { Controller } from "react-hook-form";
import { DateField } from "@/components/DateField.js";
import { MoneyInput } from "@/components/MoneyInput.js";
import { Button } from "@/components/ui/button.js";
import { useWelcomeForm } from "../use-welcome-form.js";
import { TimezonePicker } from "./TimezonePicker.js";

/** First name only, as in the Home greeting (UI.md 9). */
function greeting(name: string): string {
  const firstName = name.trim().split(/\s+/)[0];
  return firstName ? `Hi ${firstName}` : "Hi there";
}

/** The welcome screen (UI.md 3.9): opening balance, its date, timezone, Continue or Skip. */
export function WelcomeForm({ me }: { me: MeResponse }) {
  const { form, today, submit, skip, changeTimezone, isSaving } = useWelcomeForm(me);
  const { control, formState } = form;
  const { errors } = formState;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-title text-text">{greeting(me.name)}</h1>
        <p className="text-body text-text-muted">Let's set up your starting point.</p>
      </header>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Controller
          control={control}
          name="openingBalance"
          render={({ field }) => (
            <MoneyInput
              label="Opening balance"
              allowNegative
              value={field.value}
              onChange={field.onChange}
              error={errors.openingBalance?.message}
              disabled={isSaving}
            />
          )}
        />
        <Controller
          control={control}
          name="openingBalanceDate"
          render={({ field }) => (
            <DateField
              label="As of"
              value={field.value}
              onChange={field.onChange}
              today={today}
              disableFuture
              error={errors.openingBalanceDate?.message}
              disabled={isSaving}
            />
          )}
        />
        <Controller
          control={control}
          name="timezone"
          render={({ field }) => (
            <TimezonePicker
              value={field.value}
              onChange={changeTimezone}
              error={errors.timezone?.message}
              disabled={isSaving}
            />
          )}
        />
        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" busy={isSaving}>
            Continue
          </Button>
          <Button type="button" variant="ghost" onClick={skip} disabled={isSaving}>
            Skip for now
          </Button>
        </div>
      </form>
    </main>
  );
}
