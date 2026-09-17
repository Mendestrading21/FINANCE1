export type Currency = string;
export type Source = {
  system: "manual" | "notion" | "import" | "demo";
  sourceId?: string;
  url?: string;
  importedAt?: string;
  updatedAt?: string;
  note?: string;
};
export type Balance = {
  id: string;
  amountMinor: number | null;
  asOf: string | null;
  source: Source;
};
export type Account = {
  id: string;
  name: string;
  institution: string;
  kind: "bank" | "savings" | "investment" | "debt";
  currency: Currency;
  valuationMode: "total" | "components";
  balances: Balance[];
  source: Source;
};
export type Transaction = {
  id: string;
  label: string;
  kind: "income" | "expense" | "transfer";
  amountMinor: number;
  currency: Currency;
  status: "planned" | "settled" | "unknown";
  date: string | null;
  budgetMonth?: string;
  accountId: string | null;
  destinationAccountId?: string | null;
  destinationAmountMinor?: number | null;
  category: string;
  recurrenceId?: string;
  occurrenceDate?: string;
  source: Source;
};
export type Recurrence = {
  id: string;
  label: string;
  kind: "income" | "expense";
  amountMinor: number;
  currency: Currency;
  accountId: string | null;
  category: string;
  day: number;
  intervalMonths: number;
  startDate: string;
  endDate?: string | null;
  active: boolean;
  source: Source;
};
export type Goal = {
  id: string;
  name: string;
  targetMinor: number | null;
  reservedMinor: number | null;
  currency: Currency;
  accountId: string | null;
  dueDate: string | null;
  asOf: string | null;
  source: Source;
};
export type Position = {
  id: string;
  accountId: string;
  name: string;
  symbol: string;
  assetType: "stock" | "etf" | "option" | "crypto" | "other";
  quantity: string | null;
  valueMinor: number | null;
  currency: Currency;
  asOf: string | null;
  source: Source;
};
export type Document = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl?: string;
  url?: string;
  transactionId?: string | null;
  addedAt: string;
  source: Source;
};
export type FxRate = {
  from: string;
  to: string;
  rate: string;
  asOf: string;
  source: Source;
};
export type ReviewItem = {
  id: string;
  title: string;
  reason: string;
  source: Source;
  raw?: Record<string, unknown>;
};
export type FinanceData = {
  version: 1;
  accounts: Account[];
  transactions: Transaction[];
  recurrences: Recurrence[];
  goals: Goal[];
  positions: Position[];
  documents: Document[];
  fxRates: FxRate[];
  reviewItems: ReviewItem[];
  preferences: { baseCurrency: Currency; locale: string };
  importedAt?: string;
};
export const emptyData = (): FinanceData => ({
  version: 1,
  accounts: [],
  transactions: [],
  recurrences: [],
  goals: [],
  positions: [],
  documents: [],
  fxRates: [],
  reviewItems: [],
  preferences: { baseCurrency: "CHF", locale: "fr-CH" },
});
