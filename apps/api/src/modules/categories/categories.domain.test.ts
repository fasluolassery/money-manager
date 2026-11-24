import { describe, expect, it } from "vitest";
import { categoryNameLower, DEFAULT_CATEGORIES } from "./categories.domain.js";

describe("DEFAULT_CATEGORIES", () => {
  it("[FR-5.4] has the 8 expense categories with their emojis", () => {
    const expense = DEFAULT_CATEGORIES.filter((c) => c.type === "expense");
    expect(expense.map((c) => `${c.emoji} ${c.name}`)).toEqual([
      "🍔 Food",
      "🚌 Transport",
      "🏠 Rent",
      "🧾 Bills",
      "🛍️ Shopping",
      "💊 Health",
      "🎬 Entertainment",
      "📦 Other",
    ]);
  });

  it("[FR-5.4] has the 2 income categories with their emojis", () => {
    const income = DEFAULT_CATEGORIES.filter((c) => c.type === "income");
    expect(income.map((c) => `${c.emoji} ${c.name}`)).toEqual(["💼 Salary", "💰 Other income"]);
  });

  it("[FR-5.4] [FR-8.9] has Lending as the only built-in category, of type both", () => {
    const builtIn = DEFAULT_CATEGORIES.filter((c) => c.builtIn);
    expect(builtIn).toEqual([{ name: "Lending", emoji: "🤝", type: "both", builtIn: true }]);
  });

  it("[FR-5.6] has names that stay unique when case is ignored", () => {
    const lowered = DEFAULT_CATEGORIES.map((c) => categoryNameLower(c.name));
    expect(new Set(lowered).size).toBe(DEFAULT_CATEGORIES.length);
  });
});

describe("categoryNameLower", () => {
  it("[FR-5.6] lowercases and normalizes to NFC", () => {
    expect(categoryNameLower("Other Income")).toBe("other income");
    expect(categoryNameLower("Cafe\u0301")).toBe("caf\u00e9");
  });
});
