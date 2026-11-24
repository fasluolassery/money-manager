export type CategoryType = "expense" | "income" | "both";

export type DefaultCategory = {
  name: string;
  emoji: string;
  type: CategoryType;
  /** True only for Lending (FR-5.4, Spec Rule 8). */
  builtIn: boolean;
};

const expense = (emoji: string, name: string): DefaultCategory => ({
  name,
  emoji,
  type: "expense",
  builtIn: false,
});

const income = (emoji: string, name: string): DefaultCategory => ({
  name,
  emoji,
  type: "income",
  builtIn: false,
});

/** The categories every new user starts with (FR-5.4, Spec Rule 5), Lending last. */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  expense("🍔", "Food"),
  expense("🚌", "Transport"),
  expense("🏠", "Rent"),
  expense("🧾", "Bills"),
  expense("🛍️", "Shopping"),
  expense("💊", "Health"),
  expense("🎬", "Entertainment"),
  expense("📦", "Other"),
  income("💼", "Salary"),
  income("💰", "Other income"),
  { name: "Lending", emoji: "🤝", type: "both", builtIn: true },
];

/** The lowercase copy that makes names unique per user, ignoring case (FR-5.6, DESIGN 5.1). */
export function categoryNameLower(name: string): string {
  return name.normalize("NFC").toLowerCase();
}
