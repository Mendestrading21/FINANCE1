import { describe, expect, it } from "vitest";
import { mergeImport, validateData } from "./validation";
import {
  emptyData,
  type Account,
  type Recurrence,
  type Transaction,
} from "./types";
const source = { system: "manual" as const };
const recurrence = (extra: Partial<Recurrence> = {}): Recurrence => ({
  id: "rent",
  label: "Loyer",
  kind: "expense",
  amountMinor: 200000,
  currency: "CHF",
  accountId: "bank",
  category: "",
  day: 1,
  intervalMonths: 1,
  startDate: "2026-01-01",
  active: true,
  source: { ...source },
  ...extra,
});
const account = (id = "bank"): Account => ({
  id,
  name: "Compte",
  institution: "",
  kind: "bank",
  currency: "CHF",
  valuationMode: "total",
  balances: [
    {
      id: `${id}:observation`,
      amountMinor: 10000,
      asOf: null,
      source: { ...source },
    },
  ],
  source: { ...source },
});
const transaction = (): Transaction => ({
  id: "payment",
  label: "Loyer",
  kind: "expense",
  amountMinor: 10000,
  currency: "CHF",
  status: "unknown",
  date: null,
  accountId: "bank",
  category: "",
  source: { ...source },
});
const sample = () => ({
  ...emptyData(),
  accounts: [account()],
  transactions: [transaction()],
});

describe("frontière de validation des données privées", () => {
  it("valide et clone les données sans transformer les inconnues en zéro/date d’import", () => {
    const original = sample();
    original.importedAt = "2026-09-17T12:00:00Z";
    const valid = validateData(original);
    expect(valid.accounts[0].balances[0].asOf).toBeNull();
    expect(valid.transactions[0].date).toBeNull();
    expect(valid).toEqual(original);
    expect(valid.accounts).not.toBe(original.accounts);
  });
  it("valide un mois budgétaire tout en conservant une date absente", () => {
    const d = sample();
    d.transactions[0].budgetMonth = "2026-09";
    expect(validateData(d).transactions[0].date).toBeNull();
    d.transactions[0].budgetMonth = "2026-13";
    expect(() => validateData(d)).toThrow();
  });
  it("rejette versions, structures et champs non reconnus", () => {
    for (const malformed of [
      null,
      {},
      [],
      { ...emptyData(), version: 2 },
      { ...emptyData(), surprising: true },
      { ...emptyData(), transactions: {} },
    ])
      expect(() => validateData(malformed)).toThrow();
  });
  it("rejette montants flottants, non finis, entiers non sûrs et dépenses négatives", () => {
    for (const amount of [
      1.01,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
      -1,
    ]) {
      const d = sample();
      d.transactions[0].amountMinor = amount;
      expect(() => validateData(d)).toThrow();
    }
  });
  it("rejette dates invalides, statut inconnu et références cassées", () => {
    const date = sample();
    date.transactions[0].date = "2026-02-29";
    expect(() => validateData(date)).toThrow();
    const reference = sample();
    reference.transactions[0].accountId = "missing";
    expect(() => validateData(reference)).toThrow();
    const status = sample();
    status.transactions[0].status = "paid" as never;
    expect(() => validateData(status)).toThrow();
  });
  it("refuse doubles identifiants et doubles sources primaires", () => {
    const d = sample();
    d.accounts.push(account());
    expect(() => validateData(d)).toThrow(/doublon/);
    const s = sample();
    s.accounts[0].source = { system: "notion", sourceId: "page" };
    s.accounts.push({
      ...account("other"),
      source: { system: "notion", sourceId: "page" },
    });
    expect(() => validateData(s)).toThrow(/doublon/);
  });
  it("autorise plusieurs observations distinctes d’une même source et journée", () => {
    const d = sample();
    d.accounts[0].balances[0] = {
      id: "first",
      amountMinor: 100,
      asOf: "2026-09-17",
      source: { system: "notion", sourceId: "account" },
    };
    d.accounts[0].balances.push({
      id: "second",
      amountMinor: 200,
      asOf: "2026-09-17",
      source: { system: "notion", sourceId: "account" },
    });
    expect(validateData(d).accounts[0].balances).toHaveLength(2);
  });
  it("impose les deux comptes et les montants de réception des transferts multidevises", () => {
    const d = sample();
    d.accounts.push({ ...account("eur"), currency: "EUR" });
    d.transactions[0] = {
      ...transaction(),
      kind: "transfer",
      destinationAccountId: "eur",
    };
    expect(() => validateData(d)).toThrow(/montant reçu/);
    d.transactions[0].destinationAmountMinor = 9000;
    expect(validateData(d).transactions).toHaveLength(1);
    d.transactions[0].destinationAccountId = "bank";
    expect(() => validateData(d)).toThrow(/distincts/);
  });
  it("refuse la pollution de prototype et les URL exécutables", () => {
    const d = sample();
    d.accounts[0].source.url = "javascript:alert(1)" as never;
    expect(() => validateData(d)).toThrow();
    const polluted = JSON.parse(JSON.stringify(sample()));
    polluted.reviewItems = [
      {
        id: "review",
        title: "Import",
        reason: "Inconnu",
        source,
        raw: JSON.parse('{"__proto__":{"polluted":true}}'),
      },
    ];
    expect(() => validateData(polluted)).toThrow(/clé interdite/);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it("rejette les pièces actives et garde les fichiers base64 autorisés", () => {
    const d = sample();
    d.documents.push({
      id: "doc",
      name: "Reçu",
      mimeType: "application/pdf",
      dataUrl: "data:application/pdf;base64,JVBERg==",
      transactionId: "payment",
      addedAt: "2026-09-17T12:00:00Z",
      source,
    });
    expect(validateData(d).documents).toHaveLength(1);
    d.documents[0].dataUrl = "data:text/html;base64,PHNjcmlwdD4=";
    expect(() => validateData(d)).toThrow();
  });
  it("refuse avant sauvegarde les sommes et conversions qui pourraient casser le rendu", () => {
    const d = sample();
    d.accounts[0].balances[0].amountMinor = Number.MAX_SAFE_INTEGER;
    d.accounts.push(account("second"));
    expect(() => validateData(d)).toThrow(/précision sûre/);
    const fx = sample();
    fx.fxRates.push({
      from: "CHF",
      to: "USD",
      rate: "999999999999999999999999",
      asOf: "2026-09-17",
      source,
    });
    expect(() => validateData(fx)).toThrow(/précision sûre/);
  });
  it("borne la somme des conversions arrondies séparément, pas seulement la somme convertie", () => {
    const d = emptyData();
    d.accounts = Array.from({ length: 7 }, (_, index) => ({
      ...account(`a${index}`),
      balances: [
        {
          id: `b${index}`,
          amountMinor: index === 6 ? 6004799503160653 : 1,
          asOf: "2026-09-17",
          source,
        },
      ],
    }));
    d.fxRates = [
      { from: "CHF", to: "EUR", rate: "1.5", asOf: "2026-09-17", source },
    ];
    expect(() => validateData(d)).toThrow(/précision sûre/);
  });
  it("valide un historique de montant de récurrence bien formé et rejette les incohérences", () => {
    const d = sample();
    d.recurrences = [
      recurrence({
        amountMinor: 3000,
        amountEffectiveFrom: "2026-09-17",
        amountHistory: [{ amountMinor: 2000, effectiveFrom: "2026-01-01" }],
      }),
    ];
    expect(validateData(d).recurrences[0].amountHistory).toEqual([
      { amountMinor: 2000, effectiveFrom: "2026-01-01" },
    ]);
    // Une entrée d’historique ne peut pas être postérieure ou égale au montant courant.
    const overlapping = sample();
    overlapping.recurrences = [
      recurrence({
        amountMinor: 3000,
        amountEffectiveFrom: "2026-09-17",
        amountHistory: [{ amountMinor: 2000, effectiveFrom: "2026-09-17" }],
      }),
    ];
    expect(() => validateData(overlapping)).toThrow(/postérieur ou égal/);
    // Les entrées doivent être strictement croissantes, sans doublon de date.
    const unordered = sample();
    unordered.recurrences = [
      recurrence({
        amountMinor: 4000,
        amountEffectiveFrom: "2026-12-01",
        amountHistory: [
          { amountMinor: 3000, effectiveFrom: "2026-09-17" },
          { amountMinor: 2000, effectiveFrom: "2026-01-01" },
        ],
      }),
    ];
    expect(() => validateData(unordered)).toThrow(/strictement croissant/);
    // La date d’effet du montant ne peut pas précéder le début de la récurrence.
    const early = sample();
    early.recurrences = [
      recurrence({ startDate: "2026-01-01", amountEffectiveFrom: "2025-12-31" }),
    ];
    expect(() => validateData(early)).toThrow(/antérieure au début/);
  });
  it("borne la somme incluant l’historique de montant des récurrences", () => {
    const d = sample();
    d.accounts[0].balances[0].amountMinor = Number.MAX_SAFE_INTEGER - 1;
    d.recurrences = [
      recurrence({
        amountMinor: 1,
        amountEffectiveFrom: "2026-09-17",
        amountHistory: [
          { amountMinor: Number.MAX_SAFE_INTEGER - 1, effectiveFrom: "2026-01-01" },
        ],
      }),
    ];
    expect(() => validateData(d)).toThrow(/précision sûre/);
  });
  it("rejette sauvegardes trop grandes et structures profondément imbriquées", () => {
    expect(() =>
      validateData({ ...emptyData(), padding: "x".repeat(30 * 1024 * 1024) }),
    ).toThrow(/grande/);
    let nested: Record<string, unknown> = {};
    for (let i = 0; i < 15; i++) nested = { nested };
    expect(() =>
      validateData({
        ...emptyData(),
        reviewItems: [
          {
            id: "review",
            title: "Import",
            reason: "À vérifier",
            source,
            raw: nested,
          },
        ],
      }),
    ).toThrow(/profond/);
  });
});

describe("imports idempotents et non destructifs", () => {
  it("ne duplique rien lors du second import", () => {
    const original = sample();
    expect(mergeImport(original, original)).toEqual(original);
    const first = mergeImport(emptyData(), original);
    expect(mergeImport(first, original)).toEqual(first);
  });
  it("ne remplace pas une correction manuelle et met la proposition en attente une seule fois", () => {
    const original = sample();
    original.transactions[0].amountMinor = 12000;
    original.transactions[0].source = {
      system: "notion",
      sourceId: "row",
      updatedAt: "2026-09-17T13:00:00Z",
    };
    const incoming = sample();
    incoming.transactions[0].source = {
      system: "notion",
      sourceId: "row",
      updatedAt: "2026-09-16T13:00:00Z",
    };
    const first = mergeImport(original, incoming);
    expect(first.transactions[0].amountMinor).toBe(12000);
    expect(first.reviewItems).toHaveLength(1);
    expect(first.reviewItems[0].raw?.incoming).toMatchObject({
      amountMinor: 10000,
    });
    expect(mergeImport(first, incoming)).toEqual(first);
    expect(original.reviewItems).toHaveLength(0);
  });
  it("ne crée pas de faux conflit si seule la date de lecture Notion change", () => {
    const original = sample(),
      incoming = sample();
    original.transactions[0].source.importedAt = "2026-09-16T12:00:00Z";
    incoming.transactions[0].source.importedAt = "2026-09-17T12:00:00Z";
    expect(mergeImport(original, incoming).reviewItems).toHaveLength(0);
  });
  it("reconnaît les sources stables et rapproche les références de comptes", () => {
    const original = sample();
    original.accounts[0].source = { system: "notion", sourceId: "bank-page" };
    const incoming = sample();
    incoming.accounts[0].id = "new-bank-id";
    incoming.accounts[0].source = { system: "notion", sourceId: "bank-page" };
    incoming.transactions[0].id = "new-payment";
    incoming.transactions[0].accountId = "new-bank-id";
    const merged = mergeImport(original, incoming);
    expect(merged.accounts).toHaveLength(1);
    expect(
      merged.transactions.find((t) => t.id === "new-payment")?.accountId,
    ).toBe("bank");
  });
  it("rejette une collision de comptes de sources différentes avant de rattacher leurs opérations", () => {
    const original = sample();
    original.accounts[0].source = { system: "notion", sourceId: "account-A" };
    const incoming = sample();
    incoming.accounts[0].source = { system: "notion", sourceId: "account-B" };
    incoming.transactions[0].id = "new-transaction";
    expect(() => mergeImport(original, incoming)).toThrow(/identité ambiguë/);
    expect(original.transactions).toHaveLength(1);
  });
  it("refuse un identifiant visant A quand la source vise le compte B", () => {
    const original = sample();
    original.accounts[0].source = { system: "notion", sourceId: "source-A" };
    original.accounts.push({
      ...account("other"),
      source: { system: "notion", sourceId: "source-B" },
    });
    const incoming = sample();
    incoming.accounts[0].source = { system: "notion", sourceId: "source-B" };
    expect(() => mergeImport(original, incoming)).toThrow(/identité ambiguë/);
  });
  it("préserve les préférences existantes et ne supprime pas les données omises", () => {
    const original = sample();
    original.preferences.baseCurrency = "EUR";
    const merged = mergeImport(original, emptyData());
    expect(merged.preferences.baseCurrency).toBe("EUR");
    expect(merged.transactions).toHaveLength(1);
  });
  it("rejette atomiquement un import malformé sans toucher au coffre précédent", () => {
    const original = sample(),
      incoming = sample();
    incoming.transactions[0].accountId = "missing";
    expect(() => mergeImport(original, incoming)).toThrow();
    expect(original.transactions[0].accountId).toBe("bank");
  });
});
