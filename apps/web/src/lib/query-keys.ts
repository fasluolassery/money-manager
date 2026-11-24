/**
 * Query key factory (DESIGN 8.11). All keys shaped [feature, ...scope].
 * Keys are never written inline — always use this factory.
 */
export const queryKeys = {
  health: () => ["health"] as const,
  session: () => ["session"] as const,
  me: () => ["me"] as const,
  home: () => ["home"] as const,
  payees: () => ["payees"] as const,
  transactions: {
    all: () => ["transactions"] as const,
    list: (filters: unknown) => ["transactions", "list", filters] as const,
  },
  reports: {
    all: () => ["reports"] as const,
    summary: (month: string, includeLending: boolean) =>
      ["reports", "summary", month, includeLending] as const,
  },
  categories: {
    all: () => ["categories"] as const,
  },
  bills: {
    all: () => ["bills"] as const,
  },
  goals: {
    all: () => ["goals"] as const,
  },
  lending: {
    all: () => ["lending"] as const,
  },
  people: {
    all: () => ["people"] as const,
  },
};
