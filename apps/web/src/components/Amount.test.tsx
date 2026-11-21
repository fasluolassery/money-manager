import type { Paise } from "@money-manager/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Amount } from "./Amount.js";

function p(n: number): Paise {
  return n as Paise;
}

describe("Amount", () => {
  it("[FR-14.1] renders an expense with no sign and normal text colour", () => {
    render(<Amount paise={p(240000)} variant="expense" data-testid="amount" />);
    const el = screen.getByTestId("amount");
    expect(el.textContent).toBe("₹2,400");
    expect(el.className).not.toContain("text-income");
  });

  it("[FR-14.3] renders income with + sign and income colour", () => {
    render(<Amount paise={p(8500000)} variant="income" data-testid="amount" />);
    const el = screen.getByTestId("amount");
    expect(el.textContent).toBe("+₹85,000");
    expect(el.className).toContain("text-income");
  });

  it("[FR-14.1] renders a total with no sign and normal text colour", () => {
    render(<Amount paise={p(12450000)} variant="total" data-testid="amount" />);
    const el = screen.getByTestId("amount");
    expect(el.textContent).toBe("₹1,24,500");
    expect(el.className).not.toContain("text-income");
  });

  it("[FR-14.3] renders zero income as ₹0 in normal colour, not income colour", () => {
    render(<Amount paise={p(0)} variant="income" data-testid="amount" />);
    const el = screen.getByTestId("amount");
    expect(el.textContent).toBe("₹0");
    expect(el.className).not.toContain("text-income");
  });

  it("[FR-14.3] renders a positive left-over with + sign and normal colour", () => {
    render(<Amount paise={p(2200000)} variant="left-over" data-testid="amount" />);
    const el = screen.getByTestId("amount");
    expect(el.textContent).toBe("+₹22,000");
    expect(el.className).not.toContain("text-income");
  });

  it("[FR-14.2] renders a negative left-over with − sign and normal colour", () => {
    render(<Amount paise={p(-800000)} variant="left-over" data-testid="amount" />);
    const el = screen.getByTestId("amount");
    expect(el.textContent).toBe("−₹8,000");
    expect(el.className).not.toContain("text-income");
  });

  it("[FR-14.2] renders a negative balance with − sign and normal colour", () => {
    render(<Amount paise={p(-50000)} variant="balance" data-testid="amount" />);
    const el = screen.getByTestId("amount");
    expect(el.textContent).toBe("−₹500");
    expect(el.className).not.toContain("text-income");
  });

  it("[FR-14.1] formats paise correctly (₹125.50)", () => {
    render(<Amount paise={p(12550)} variant="expense" data-testid="amount" />);
    expect(screen.getByTestId("amount").textContent).toBe("₹125.50");
  });

  it("[FR-14.1] groups lakhs in Indian style (₹1,00,000)", () => {
    render(<Amount paise={p(10000000)} variant="income" data-testid="amount" />);
    expect(screen.getByTestId("amount").textContent).toBe("+₹1,00,000");
  });

  it("[FR-14.1] groups crores in Indian style (₹1,00,00,000)", () => {
    render(<Amount paise={p(1000000000)} variant="income" data-testid="amount" />);
    expect(screen.getByTestId("amount").textContent).toBe("+₹1,00,00,000");
  });
});
