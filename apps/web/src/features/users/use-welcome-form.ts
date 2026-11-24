import {
  fromLocalDate,
  type MeResponse,
  type Paise,
  type PatchMeBody,
  patchMeBodySchema,
  todayIn,
  toLocalDate,
} from "@money-manager/shared";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { handleStaleRecord } from "@/lib/handle-stale-record.js";
import { queryKeys } from "@/lib/query-keys.js";
import { saveErrorFields, saveErrorMessage, useUpdateMe } from "./api.js";
import { detectTimezone } from "./timezones.js";

export type WelcomeValues = {
  openingBalance: Paise | null;
  openingBalanceDate: Date | undefined;
  timezone: string;
};

const FIELDS = ["openingBalance", "openingBalanceDate", "timezone"] as const;
const isField = (name: string): name is (typeof FIELDS)[number] =>
  (FIELDS as readonly string[]).includes(name);

/**
 * The welcome screen's form (UI.md 3.9, DESIGN 7.2): the device's timezone, the opening
 * balance (default as saved, ₹0) and its date (default today). Continue sends all three,
 * Skip only the timezone; either way the first save finishes onboarding.
 */
export function useWelcomeForm(me: MeResponse) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateMe = useUpdateMe();
  const [defaultValues] = React.useState<WelcomeValues>(() => {
    const detected = detectTimezone();
    return {
      openingBalance: me.openingBalance,
      openingBalanceDate: toLocalDate(todayIn(detected, new Date())),
      timezone: detected,
    };
  });
  const form = useForm<WelcomeValues>({ defaultValues });
  const timezone = form.watch("timezone");
  // Local midnight on today's date in the chosen timezone, for the date picker.
  const today = React.useMemo(() => toLocalDate(todayIn(timezone, new Date())), [timezone]);

  function showFieldErrors(errors: { field: string; message: string }[]) {
    for (const { field, message } of errors) {
      if (isField(field)) form.setError(field, { message });
    }
  }

  function save(body: PatchMeBody) {
    updateMe.mutate(body, {
      onSuccess: () => navigate("/", { replace: true }),
      onError: (error) => {
        if (handleStaleRecord(error, queryClient, queryKeys.me())) return;
        const fields = saveErrorFields(error);
        if (fields.length > 0) showFieldErrors(fields);
        else toast.error(saveErrorMessage(error));
      },
    });
  }

  const submit = form.handleSubmit((values) => {
    const parsed = patchMeBodySchema.safeParse({
      version: me.version,
      timezone: values.timezone,
      openingBalance: values.openingBalance ?? undefined,
      openingBalanceDate:
        values.openingBalanceDate === undefined
          ? undefined
          : fromLocalDate(values.openingBalanceDate),
    });
    if (parsed.success) save(parsed.data);
    else
      showFieldErrors(
        parsed.error.issues.map((i) => ({ field: String(i.path[0]), message: i.message })),
      );
  });

  function changeTimezone(next: string) {
    form.setValue("timezone", next);
    const date = form.getValues("openingBalanceDate");
    const nextToday = todayIn(next, new Date());
    if (date !== undefined && fromLocalDate(date) > nextToday) {
      form.setValue("openingBalanceDate", toLocalDate(nextToday));
    }
  }

  return {
    form,
    today,
    submit,
    changeTimezone,
    skip: () => save({ version: me.version, timezone: form.getValues("timezone") }),
    isSaving: updateMe.isPending,
  };
}
