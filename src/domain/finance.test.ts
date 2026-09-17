import { afterEach, describe, expect, it, vi } from "vitest";
import {
  availableSummary,
  convertMinor,
  latestBalance,
  money,
  monthLabel,
  monthSummary,
  parseMoney,
  today,
  transactionsForMonth,
  wealthSummary,
} from "./finance";
import {
  emptyData,
  type Account,
  type FinanceData,
  type Recurrence,
  type Transaction,
} from "./types";

const source = { system: "manual" as const };
const account = (
  id = "bank",
  amount: number | null = 100000,
  asOf: string | null = "2026-09-17",
  extra: Partial<Account> = {},
): Account => ({
  id,
  name: id,
  institution: "",
  kind: "bank",
  currency: "CHF",
  valuationMode: "total",
  balances: [{ id: `${id}:balance`, amountMinor: amount, asOf, source }],
  source,
  ...extra,
});
const transaction = (extra: Partial<Transaction> = {}): Transaction => ({
  id: "expense",
  label: "Dépense",
  kind: "expense",
  amountMinor: 15000,
  currency: "CHF",
  status: "planned",
  date: "2026-09-20",
  accountId: "bank",
  category: "",
  source,
  ...extra,
});
const recurrence = (extra: Partial<Recurrence> = {}): Recurrence => ({
  id: "rent",
  label: "Loyer",
  kind: "expense",
  amountMinor: 200000,
  currency: "CHF",
  accountId: "bank",
  category: "",
  day: 31,
  intervalMonths: 1,
  startDate: "2026-01-31",
  active: true,
  source,
  ...extra,
});
const data = (extra: Partial<FinanceData> = {}): FinanceData => ({
  ...emptyData(),
  ...extra,
});
afterEach(() => vi.useRealTimers());

describe("montants exacts", () => {
  it("accepte les centimes et formats suisse/français sans utiliser un flottant", () => {
    expect(parseMoney("1’234.05")).toBe(123405);
    expect(parseMoney("1 234,50")).toBe(123450);
    expect(parseMoney("0.29")).toBe(29);
    expect(parseMoney("-1.01")).toBe(-101);
    expect(parseMoney("90071992547409.91")).toBe(Number.MAX_SAFE_INTEGER);
  });
  it("refuse précision excessive, séparateurs ambigus, exponentiel et dépassement", () => {
    for (const value of [
      "1.001",
      "1,234.00",
      "1 23",
      "1e3",
      "CHF 10",
      "",
      "Infinity",
      "90071992547409.92",
    ])
      expect(() => parseMoney(value)).toThrow();
  });
  it("distingue montant absent et zéro explicite à l’affichage", () => {
    expect(money(null)).toBe("—");
    expect(money(0)).toContain("0.00");
    expect(money(123405)).toContain("234.05");
    expect(money(Number.MAX_SAFE_INTEGER)).toContain(".91");
    expect(money(-1)).toContain("-0.01");
    expect(() => money(10.5)).toThrow();
  });
  it("arrondit la conversion décimale seulement au centime final", () => {
    const rates = [
      { from: "USD", to: "CHF", rate: "0.915", asOf: "2026-09-01", source },
    ];
    expect(convertMinor(100, "USD", "CHF", rates, "2026-09-17")).toBe(92);
    expect(convertMinor(-100, "USD", "CHF", rates, "2026-09-17")).toBe(-92);
    expect(convertMinor(915, "CHF", "USD", rates, "2026-09-17")).toBe(1000);
  });
  it("n’utilise ni taux futur ni parité inventée", () => {
    expect(convertMinor(100, "EUR", "CHF", [], "2026-09-17")).toBeNull();
    expect(
      convertMinor(
        100,
        "EUR",
        "CHF",
        [{ from: "EUR", to: "CHF", rate: "1.1", asOf: "2026-10-01", source }],
        "2026-09-17",
      ),
    ).toBeNull();
  });
  it("garde le jour local", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 17, 0, 2));
    expect(today()).toBe("2026-09-17");
    expect(monthLabel("2026-09")).toContain("septembre");
  });
});

describe("observations et patrimoine", () => {
  it("exclut les soldes non datés même quand l’import est daté", () => {
    const a = account("bank", 100000, null);
    a.balances[0].source = {
      system: "notion",
      importedAt: "2026-09-17T12:00:00Z",
    };
    expect(latestBalance(a, "2026-09-17")).toBeNull();
    expect(
      wealthSummary(data({ accounts: [a] }), "CHF", "2026-09-17"),
    ).toMatchObject({ totalMinor: null, partial: true, excluded: 1 });
  });
  it("prend la dernière observation d’une même journée et respecte une vue historique", () => {
    const a = account();
    a.balances = [
      { id: "old", amountMinor: 100, asOf: "2026-08-31", source },
      { id: "morning", amountMinor: 200, asOf: "2026-09-17", source },
      { id: "evening", amountMinor: 300, asOf: "2026-09-17", source },
      { id: "future", amountMinor: 400, asOf: "2026-10-01", source },
    ];
    expect(latestBalance(a, "2026-09-17")?.amountMinor).toBe(300);
    expect(latestBalance(a, "2026-09-01")?.amountMinor).toBe(100);
  });
  it("ne remplace pas une observation inconnue récente par une ancienne connue", () => {
    const a = account();
    a.balances.push({
      id: "unknown",
      amountMinor: null,
      asOf: "2026-09-18",
      source,
    });
    expect(
      wealthSummary(data({ accounts: [a] }), "CHF", "2026-09-18").totalMinor,
    ).toBeNull();
  });
  it("ne compte jamais positions et valeur totale de compte deux fois", () => {
    const holdings = [
      {
        id: "stock",
        accountId: "broker",
        name: "Action",
        symbol: "TEST",
        assetType: "stock" as const,
        quantity: "1",
        valueMinor: 40000,
        currency: "CHF",
        asOf: "2026-09-17",
        source,
      },
    ];
    const d = data({
      accounts: [
        account("broker", 100000, "2026-09-17", { kind: "investment" }),
      ],
      positions: holdings,
    });
    expect(wealthSummary(d, "CHF", "2026-09-17").totalMinor).toBe(100000);
    d.accounts[0].valuationMode = "components";
    expect(wealthSummary(d, "CHF", "2026-09-17").totalMinor).toBe(140000);
    d.positions[0].asOf = null as never;
    expect(wealthSummary(d, "CHF", "2026-09-17").totalMinor).toBeNull();
  });
  it("soustrait les dettes quelle que soit la convention de signe saisie", () => {
    expect(
      wealthSummary(
        data({
          accounts: [
            account("bank", 100000),
            account("debt", 20000, "2026-09-17", { kind: "debt" }),
          ],
        }),
        "CHF",
        "2026-09-17",
      ).totalMinor,
    ).toBe(80000);
    expect(
      wealthSummary(
        data({
          accounts: [account("debt", -20000, "2026-09-17", { kind: "debt" })],
        }),
        "CHF",
        "2026-09-17",
      ).totalMinor,
    ).toBe(-20000);
  });
  it("signale les comptes exclus faute de conversion", () => {
    const result = wealthSummary(
      data({
        accounts: [
          account(),
          account("foreign", 100000, "2026-09-17", { currency: "EUR" }),
        ],
      }),
      "CHF",
      "2026-09-17",
    );
    expect(result).toMatchObject({
      totalMinor: 100000,
      partial: true,
      excluded: 1,
    });
    expect(result.items[1].valueMinor).toBeNull();
  });
  it("refuse de déborder silencieusement lors de sommes", () => {
    expect(() =>
      wealthSummary(
        data({
          accounts: [account("a", Number.MAX_SAFE_INTEGER), account("b", 1)],
        }),
        "CHF",
        "2026-09-17",
      ),
    ).toThrow();
  });
});

describe("mois et récurrences", () => {
  it("rabats le 31 au dernier jour de février, y compris année bissextile", () => {
    const d = data({ recurrences: [recurrence()] });
    expect(transactionsForMonth(d, "2026-02")[0].date).toBe("2026-02-28");
    expect(transactionsForMonth(d, "2028-02")[0].date).toBe("2028-02-29");
    expect(transactionsForMonth(d, "2026-03")[0].date).toBe("2026-03-31");
  });
  it("respecte le début, la fin et les intervalles annuels", () => {
    const d = data({
      recurrences: [
        recurrence({
          startDate: "2025-12-31",
          intervalMonths: 12,
          endDate: "2026-12-31",
        }),
      ],
    });
    expect(transactionsForMonth(d, "2026-11")).toHaveLength(0);
    expect(transactionsForMonth(d, "2026-12")).toHaveLength(1);
    expect(transactionsForMonth(d, "2027-12")).toHaveLength(0);
  });
  it("ne double pas une récurrence réglée et prend le mois réel d’un paiement tardif", () => {
    const d = data({
      recurrences: [recurrence()],
      transactions: [
        transaction({
          id: "payment",
          recurrenceId: "rent",
          occurrenceDate: "2026-09-30",
          status: "settled",
          date: "2026-10-02",
        }),
      ],
    });
    expect(transactionsForMonth(d, "2026-09")).toHaveLength(0);
    expect(
      transactionsForMonth(d, "2026-10").filter((t) => t.id === "payment"),
    ).toHaveLength(1);
  });
  it("distingue prévu/reçu et prévu/payé, les transferts sont neutres", () => {
    const d = data({
      transactions: [
        transaction({
          id: "income1",
          kind: "income",
          status: "settled",
          amountMinor: 500000,
        }),
        transaction({ id: "income2", kind: "income", amountMinor: 100000 }),
        transaction({ id: "out1", status: "settled", amountMinor: 200000 }),
        transaction({ id: "out2", amountMinor: 50000 }),
        transaction({ id: "transfer", kind: "transfer", amountMinor: 900000 }),
      ],
    });
    expect(monthSummary(d, "2026-09", "CHF")).toEqual({
      incomePlanned: 100000,
      incomeSettled: 500000,
      expensePlanned: 50000,
      expenseSettled: 200000,
      remaining: 350000,
      unknownCount: 0,
    });
  });
  it("conserve le mois budgétaire sans inventer une date journalière", () => {
    const d = data({
      transactions: [
        transaction({ date: null, budgetMonth: "2026-09", status: "unknown" }),
      ],
    });
    expect(transactionsForMonth(d, "2026-09")[0].date).toBeNull();
    expect(transactionsForMonth(d, "2026-10")).toHaveLength(0);
    expect(monthSummary(d, "2026-09", "CHF").unknownCount).toBe(1);
    expect(monthSummary(d, "2026-10", "CHF").unknownCount).toBe(0);
  });
  it("ne confond pas le mois budgétaire et le mois de règlement d’une opération payée sans date", () => {
    const d = data({
      transactions: [
        transaction({
          id: "undated-income",
          kind: "income",
          status: "settled",
          date: null,
          budgetMonth: "2026-09",
        }),
        transaction({ status: "settled" }),
      ],
    });
    expect(transactionsForMonth(d, "2026-09")).toHaveLength(2);
    expect(monthSummary(d, "2026-09", "CHF")).toMatchObject({
      incomeSettled: null,
      expenseSettled: 15000,
      remaining: null,
      unknownCount: 1,
    });
    d.transactions[0].status = "planned";
    expect(monthSummary(d, "2026-09", "CHF").incomePlanned).toBe(15000);
  });
  it("absence de lignes n’est pas une valeur égale à zéro", () => {
    expect(monthSummary(emptyData(), "2026-09", "CHF")).toMatchObject({
      incomePlanned: null,
      incomeSettled: null,
      expensePlanned: null,
      expenseSettled: null,
      remaining: null,
    });
  });
  it("statut inconnu, date absente et FX manquant invalident la projection", () => {
    const d = data({
      transactions: [
        transaction({ id: "unknown", status: "unknown" }),
        transaction({ id: "undated", date: null }),
        transaction({ id: "fx", currency: "USD" }),
      ],
    });
    expect(monthSummary(d, "2026-09", "CHF")).toMatchObject({
      remaining: null,
      unknownCount: 3,
    });
  });
  it("les lignes mises en attente rendent la projection incomplète", () => {
    const d = data({
      transactions: [
        transaction(),
        transaction({ id: "salary", kind: "income" }),
      ],
      reviewItems: [
        {
          id: "review",
          title: "Montant à vérifier",
          reason: "Import partiel",
          source,
        },
      ],
    });
    expect(monthSummary(d, "2026-09", "CHF").remaining).toBeNull();
  });
});

describe("argent disponible prudent", () => {
  const now = () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 17, 12));
  };
  it("soustrait réserves et engagements présents et en retard", () => {
    now();
    const d = data({
      accounts: [account()],
      transactions: [
        transaction(),
        transaction({ id: "late", date: "2026-08-12", amountMinor: 10000 }),
      ],
      goals: [
        {
          id: "tax",
          name: "Impôts",
          targetMinor: 100000,
          reservedMinor: 20000,
          currency: "CHF",
          accountId: "bank",
          dueDate: null,
          asOf: "2026-09-17",
          source,
        },
      ],
    });
    expect(availableSummary(d, "CHF", "2026-09")).toEqual({
      amountMinor: 55000,
      asOf: "2026-09-17",
      partial: false,
    });
  });
  it("n’annonce pas un ancien solde comme disponible aujourd’hui", () => {
    now();
    expect(
      availableSummary(
        data({ accounts: [account("bank", 100000, "2026-09-16")] }),
        "CHF",
        "2026-09",
      ).amountMinor,
    ).toBeNull();
  });
  it("invalide le disponible après paiement au lieu de le faire artificiellement remonter", () => {
    now();
    const d = data({
      accounts: [account()],
      transactions: [transaction({ date: "2026-09-17", status: "settled" })],
    });
    expect(availableSummary(d, "CHF", "2026-09").amountMinor).toBeNull();
  });
  it("invalide le disponible pour un règlement non daté concernant les comptes bancaires", () => {
    now();
    for (const related of [
      { accountId: "bank" },
      { accountId: null },
      { accountId: "savings", destinationAccountId: "bank", kind: "transfer" as const },
    ]) {
      const d = data({
        accounts: [account(), account("savings", 50000, "2026-09-17", { kind: "savings" })],
        transactions: [transaction({
          ...related,
          status: "settled",
          date: null,
          budgetMonth: "2026-09",
        })],
      });
      expect(availableSummary(d, "CHF", "2026-09")).toMatchObject({
        amountMinor: null,
        partial: true,
      });
    }
  });
  it("signale les réserves inconnues et les anciennes récurrences non rapprochées", () => {
    now();
    expect(
      availableSummary(
        data({ accounts: [account()], recurrences: [recurrence()] }),
        "CHF",
        "2026-09",
      ).amountMinor,
    ).toBeNull();
    expect(
      availableSummary(
        data({
          accounts: [account()],
          goals: [
            {
              id: "goal",
              name: "Réserve",
              targetMinor: null,
              reservedMinor: null,
              currency: "CHF",
              accountId: "bank",
              dueDate: null,
              asOf: null,
              source,
            },
          ],
        }),
        "CHF",
        "2026-09",
      ).amountMinor,
    ).toBeNull();
  });
});
