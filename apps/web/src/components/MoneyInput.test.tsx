// @vitest-environment jsdom
import type { Paise } from "@money-manager/shared";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MoneyInput } from "./MoneyInput.js";

type HarnessProps = {
  initial?: Paise | null;
  allowNegative?: boolean;
  onValue?: (value: Paise | null) => void;
  error?: string;
};

function Harness({ initial = null, allowNegative, onValue, error }: HarnessProps) {
  const [value, setValue] = useState<Paise | null>(initial);
  return (
    <MoneyInput
      label="Opening balance"
      value={value}
      allowNegative={allowNegative}
      error={error}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

const field = () => screen.getByLabelText("Opening balance") as HTMLInputElement;

describe("MoneyInput", () => {
  it("[FR-9.1] has a ₹ prefix and opens the decimal keypad on phones", () => {
    render(<Harness />);
    expect(screen.getByText("₹")).toBeDefined();
    expect(field().getAttribute("inputmode")).toBe("decimal");
  });

  it("[FR-14.1] groups digits the Indian way while typing and reports whole paise", async () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await userEvent.type(field(), "1234567.5");

    expect(field().value).toBe("12,34,567.5");
    expect(onValue).toHaveBeenLastCalledWith(123456750);
  });

  it("[FR-9.1] reads a trailing dot and a leading dot as partial amounts", async () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await userEvent.type(field(), "5.");
    expect(onValue).toHaveBeenLastCalledWith(500);
    await userEvent.clear(field());
    await userEvent.type(field(), ".5");
    expect(field().value).toBe(".5");
    expect(onValue).toHaveBeenLastCalledWith(50);
  });

  it("[FR-9.1] ignores letters and a third decimal", async () => {
    render(<Harness />);

    await userEvent.type(field(), "12ab.345");

    expect(field().value).toBe("12.34");
  });

  it("[FR-9.2] stops typing at ₹1,00,00,000", async () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await userEvent.type(field(), "10000000");
    await userEvent.type(field(), "1");

    expect(field().value).toBe("1,00,00,000");
    expect(onValue).toHaveBeenLastCalledWith(1_000_000_000);
  });
});

describe("MoneyInput signs and values", () => {
  it("[FR-9.2] refuses a minus sign unless negative amounts are allowed", async () => {
    render(<Harness />);

    await userEvent.type(field(), "-50");

    expect(field().value).toBe("50");
  });

  it("[FR-9.2] accepts a negative amount for the opening balance", async () => {
    const onValue = vi.fn();
    render(<Harness allowNegative onValue={onValue} />);

    await userEvent.type(field(), "-1250");

    expect(field().value).toBe("-1,250");
    expect(onValue).toHaveBeenLastCalledWith(-125000);
  });

  it("[FR-9.1] reports null while empty or holding only a minus sign", async () => {
    const onValue = vi.fn();
    render(<Harness allowNegative initial={500 as Paise} onValue={onValue} />);

    await userEvent.clear(field());
    expect(onValue).toHaveBeenLastCalledWith(null);
    await userEvent.type(field(), "-");
    expect(onValue).toHaveBeenLastCalledWith(null);
  });

  it("[FR-14.1] shows the amount the form already has, paise only when non-zero", () => {
    render(<Harness initial={125050 as Paise} />);
    expect(field().value).toBe("1,250.50");
  });

  it("[FR-9.1] follows a value the form changes from outside", () => {
    const { rerender } = render(
      <MoneyInput label="Opening balance" value={100 as Paise} onChange={() => {}} />,
    );
    rerender(<MoneyInput label="Opening balance" value={null} onChange={() => {}} />);
    expect(field().value).toBe("");
  });

  it("[FR-9.2] shows its error under the field and marks it invalid", () => {
    render(<Harness error="Enter an amount" />);
    expect(screen.getByRole("alert").textContent).toBe("Enter an amount");
    expect(field().getAttribute("aria-invalid")).toBe("true");
  });
});
