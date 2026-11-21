import { formatRupees, formatSignedRupees, type Paise } from "@money-manager/shared";
import { cn } from "@/lib/utils.js";

/**
 * How the amount should be displayed (Spec Rule 14, UI.md 5.3).
 *
 * - `expense`   : positive amount, no sign, normal text colour
 * - `income`    : positive amount, `+` sign, income colour
 * - `total`     : positive amount, no sign, normal text colour
 * - `left-over` : difference (may be negative); `+`/`−` sign, normal text colour
 * - `balance`   : may be negative; `−` sign when negative, normal text colour
 */
export type AmountVariant = "expense" | "income" | "total" | "left-over" | "balance";

interface AmountProps extends React.HTMLAttributes<HTMLSpanElement> {
  paise: Paise;
  variant: AmountVariant;
}

/**
 * The only component that renders a monetary amount (UI.md 5.3).
 * Uses tabular-nums so digits align in lists.
 */
export function Amount({ paise, variant, className, ...props }: AmountProps) {
  const signed = variant === "income" || variant === "left-over";
  const text = signed ? formatSignedRupees(paise) : formatRupees(paise);
  const isIncome = variant === "income" && paise > 0;

  return (
    <span
      className={cn("tabular-nums", isIncome ? "text-income" : "text-text", className)}
      {...props}
    >
      {text}
    </span>
  );
}
