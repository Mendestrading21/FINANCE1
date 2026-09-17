import { describe, expect, it } from "vitest";
import { emptyData, type FinanceData } from "./domain/types";
import { mergeImport } from "./domain/validation";
import { CSV_TEMPLATE, parseTransactionCsv } from "./importCsv";

const HEADER =
  "externalId;label;kind;amount;currency;status;date;budgetMonth;accountId;destinationAccountId;destinationAmount";
const existing = (): FinanceData => ({
  ...emptyData(),
  accounts: [
    {
      id: "bank-chf",
      name: "Compte fictif CHF",
      institution: "",
      kind: "bank",
      currency: "CHF",
      valuationMode: "total",
      balances: [],
      source: { system: "manual" },
    },
    {
      id: "bank-eur",
      name: "Compte fictif EUR",
      institution: "",
      kind: "bank",
      currency: "EUR",
      valuationMode: "total",
      balances: [],
      source: { system: "manual" },
    },
  ],
});

describe("import CSV Finance", () => {
  it("accepte BOM, point-virgule, virgule décimale et texte avec guillemets et retour à la ligne", async () => {
    const original = existing();
    const before = JSON.stringify(original);
    const input =
      "\uFEFF" +
      HEADER +
      "\r\n" +
      'facture-1;"Courses ""maison""\r\nSeptembre";expense;"1 234,50";CHF;planned;;2026-09;bank-chf;;\r\n';
    const result = await parseTransactionCsv(input, original);
    expect(result.transactions[0]).toMatchObject({
      id: "csv:facture-1",
      label: 'Courses "maison"\nSeptembre',
      amountMinor: 123450,
      status: "planned",
      date: null,
      budgetMonth: "2026-09",
      accountId: "bank-chf",
      source: { system: "import", sourceId: "csv:facture-1" },
    });
    expect(result.accounts).toEqual(original.accounts);
    expect(result.accounts[0]).not.toBe(original.accounts[0]);
    expect(JSON.stringify(original)).toBe(before);
  });

  it("accepte la virgule comme séparateur et les montants décimaux protégés", async () => {
    const result = await parseTransactionCsv(
      'externalId,label,kind,amount,currency\nrevenu-1,"Prime, exemple fictif",income,"123,45",CHF\n',
      emptyData(),
    );
    expect(result.transactions[0]).toMatchObject({
      amountMinor: 12345,
      status: "unknown",
      date: null,
      accountId: null,
    });
    expect(result.transactions[0]).not.toHaveProperty("budgetMonth");
  });

  it("ne remplace jamais un montant absent par zéro ou une date absente par aujourd’hui", async () => {
    const result = await parseTransactionCsv(
      HEADER + "\nzero;Montant nul explicite;expense;0;CHF;;;2026-10;;;",
      emptyData(),
    );
    expect(result.transactions[0]).toMatchObject({
      amountMinor: 0,
      status: "unknown",
      date: null,
      budgetMonth: "2026-10",
    });
    await expect(
      parseTransactionCsv(
        HEADER + "\nabsent;Montant inconnu;expense;;CHF;;;;;;",
        emptyData(),
      ),
    ).rejects.toThrow("ligne 2 : amount");
  });

  it("rejette les identifiants absents et en doublon avec la ligne source", async () => {
    await expect(
      parseTransactionCsv(
        HEADER + "\n;Exemple;expense;1;CHF;;;;;;",
        emptyData(),
      ),
    ).rejects.toThrow("ligne 2 : externalId");
    const row = "meme-id;Exemple;expense;1;CHF;;;;;;";
    await expect(
      parseTransactionCsv(HEADER + "\n" + row + "\n" + row, emptyData()),
    ).rejects.toThrow(
      "ligne 3 : externalId « meme-id » en doublon avec la ligne 2",
    );
  });

  it("conserve des identifiants stables et un réimport identique ne duplique aucune opération", async () => {
    const text =
      HEADER +
      "\npaiement-001;Exemple;expense;12.30;CHF;settled;2026-09-01;;;;";
    const first = await parseTransactionCsv(text, emptyData());
    const second = await parseTransactionCsv(text, first);
    const merged = mergeImport(first, second);
    expect(merged.transactions).toHaveLength(1);
    expect(merged.reviewItems).toHaveLength(0);
    const modified = await parseTransactionCsv(
      text.replace("12.30", "15.30"),
      merged,
    );
    const conflict = mergeImport(merged, modified);
    expect(conflict.transactions[0].amountMinor).toBe(1230);
    expect(conflict.reviewItems).toHaveLength(1);
  });

  it("rejette une fausse date et désigne la ligne physique même après un champ multiligne", async () => {
    const text =
      HEADER +
      '\nvalide;"Exemple\nmultiligne";expense;1;CHF;;;;;;\ninvalide;Fausse date;expense;1;CHF;planned;2026-02-30;;;;';
    await expect(parseTransactionCsv(text, emptyData())).rejects.toThrow(
      "ligne 4 : date invalide",
    );
    await expect(
      parseTransactionCsv(
        HEADER + "\nmois;Exemple;expense;1;CHF;;;2026-13;;;",
        emptyData(),
      ),
    ).rejects.toThrow("budgetMonth invalide");
  });

  it("vérifie les comptes et le montant réellement reçu pour un transfert entre devises", async () => {
    const data = existing();
    const valid =
      HEADER +
      "\nchange;Virement fictif;transfer;100;CHF;settled;2026-09-17;;bank-chf;bank-eur;105.20";
    const result = await parseTransactionCsv(valid, data);
    expect(result.transactions[0]).toMatchObject({
      kind: "transfer",
      amountMinor: 10000,
      destinationAmountMinor: 10520,
    });
    await expect(
      parseTransactionCsv(valid.replace(";105.20", ";"), data),
    ).rejects.toThrow("destinationAmount est obligatoire");
    await expect(
      parseTransactionCsv(valid.replace("bank-chf", "inconnu"), data),
    ).rejects.toThrow("accountId « inconnu » introuvable");
  });

  it("rejette les ambiguïtés d’en-tête, guillemets incomplets et valeurs non prévues", async () => {
    await expect(
      parseTransactionCsv(
        "externalId;externalId;label;kind;amount;currency\na;a;Texte;expense;1;CHF",
        emptyData(),
      ),
    ).rejects.toThrow("en doublon");
    await expect(
      parseTransactionCsv(
        "externalId;label;kind;amount;currency;inconnu\na;Texte;expense;1;CHF;x",
        emptyData(),
      ),
    ).rejects.toThrow("colonne inconnue");
    await expect(
      parseTransactionCsv(
        HEADER + '\na;"non terminé;expense;1;CHF;;;;;;',
        emptyData(),
      ),
    ).rejects.toThrow("guillemets non terminé");
    await expect(
      parseTransactionCsv(
        HEADER + "\na;Texte;expense;1;CHF;payé;;;;;",
        emptyData(),
      ),
    ).rejects.toThrow("status doit valoir");
  });

  it("traite les formules comme du texte et refuse leur utilisation comme montant", async () => {
    const formula = '=HYPERLINK("https://exemple.invalid")';
    const label = '"' + formula.replaceAll('"', '""') + '"';
    const result = await parseTransactionCsv(
      HEADER + "\na;" + label + ";expense;1;CHF;;;;;;",
      emptyData(),
    );
    expect(result.transactions[0].label).toBe(formula);
    await expect(
      parseTransactionCsv(
        HEADER + "\nb;Exemple;expense;=1+2;CHF;;;;;;",
        emptyData(),
      ),
    ).rejects.toThrow("amount : Montant invalide");
    await expect(
      parseTransactionCsv(" ".repeat(5_000_001), emptyData()),
    ).rejects.toThrow("5 Mo");
  });

  it("fournit un modèle importable et explicitement fictif", async () => {
    const result = await parseTransactionCsv(CSV_TEMPLATE, emptyData());
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].label).toContain("EXEMPLE FICTIF");
    expect(result.transactions[0].status).toBe("planned");
  });
});
