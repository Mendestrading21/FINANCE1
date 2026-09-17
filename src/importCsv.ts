import { isDate, parseMoney } from "./domain/finance";
import { emptyData, type FinanceData, type Transaction } from "./domain/types";
import { validateData } from "./domain/validation";

const MAX_BYTES = 5_000_000;
const HEADERS = [
  "externalId",
  "label",
  "kind",
  "amount",
  "currency",
  "status",
  "date",
  "budgetMonth",
  "accountId",
  "destinationAccountId",
  "destinationAmount",
] as const;
const REQUIRED = ["externalId", "label", "kind", "amount", "currency"] as const;
type Header = (typeof HEADERS)[number];
type Row = { cells: string[]; line: number };

/** Deliberately fictitious. Delete the example before preparing a real import. */
export const CSV_TEMPLATE =
  "\uFEFF" +
  HEADERS.join(";") +
  "\r\n" +
  "EXEMPLE_FICTIF_001;EXEMPLE FICTIF — à supprimer avant import;expense;12.50;CHF;planned;;2026-09;;;\r\n";

function fail(line: number, message: string): never {
  throw new Error(`CSV, ligne ${line} : ${message}`);
}

function delimiterOf(input: string): "," | ";" {
  let quoted = false,
    commas = 0,
    semicolons = 0;
  for (let i = 0; i < input.length; i++) {
    const character = input[i];
    if (character === '"') {
      if (quoted && input[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted) {
      if (character === ",") commas++;
      else if (character === ";") semicolons++;
      else if (character === "\r" || character === "\n") {
        if (commas || semicolons) break;
      }
    }
  }
  if (!commas && !semicolons)
    fail(1, "en-tête attendu, avec séparateur point-virgule ou virgule.");
  if (commas && semicolons)
    fail(
      1,
      "en-tête ambigu : utilisez un seul séparateur, point-virgule ou virgule.",
    );
  return semicolons ? ";" : ",";
}

/** RFC-4180 style quoted fields, with ; support. No expression or spreadsheet evaluation. */
function rowsOf(input: string, delimiter: "," | ";"): Row[] {
  const rows: Row[] = [];
  let cells: string[] = [],
    field = "",
    quoted = false,
    closed = false,
    line = 1,
    startLine = 1;
  const finishField = () => {
    cells.push(field);
    field = "";
    closed = false;
  };
  const finishRow = () => {
    finishField();
    if (cells.some((cell) => cell.trim() !== ""))
      rows.push({ cells, line: startLine });
    if (rows.length > 50_001)
      fail(startLine, "50 000 opérations maximum par import.");
    cells = [];
  };
  for (let i = 0; i < input.length; i++) {
    const character = input[i];
    if (quoted) {
      if (character === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else if (character === "\r" || character === "\n") {
        if (character === "\r" && input[i + 1] === "\n") i++;
        field += "\n";
        line++;
      } else field += character;
      continue;
    }
    if (character === delimiter) {
      finishField();
      continue;
    }
    if (character === "\r" || character === "\n") {
      if (character === "\r" && input[i + 1] === "\n") i++;
      finishRow();
      line++;
      startLine = line;
      continue;
    }
    if (character === '"') {
      if (field.length || closed)
        fail(
          line,
          "guillemet inattendu ; encadrez le champ complet avec des guillemets.",
        );
      quoted = true;
      continue;
    }
    if (closed) {
      if (character === " " || character === "\t") continue;
      fail(line, "caractère inattendu après la fermeture des guillemets.");
    }
    field += character;
  }
  if (quoted) fail(startLine, "champ entre guillemets non terminé.");
  if (field.length || cells.length || closed) finishRow();
  return rows;
}

/** Returns an incoming dataset for preview/mergeImport. It never persists or mutates existing. */
export async function parseTransactionCsv(
  text: string,
  existing: FinanceData,
): Promise<FinanceData> {
  if (
    typeof text !== "string" ||
    text.length > MAX_BYTES ||
    new TextEncoder().encode(text).byteLength > MAX_BYTES
  ) {
    throw new Error("Import CSV limité à 5 Mo.");
  }
  const input = text.replace(/^\uFEFF/, "");
  if (!input.trim()) throw new Error("Le fichier CSV est vide.");
  const rows = rowsOf(input, delimiterOf(input));
  const header = rows.shift();
  if (!header) throw new Error("Le fichier CSV ne contient pas d’en-tête.");
  const names = header.cells.map((cell) => cell.trim());
  const columns = new Map<Header, number>();
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (!HEADERS.includes(name as Header))
      fail(
        header.line,
        `colonne inconnue « ${name || "(vide)"} ». Utilisez le modèle Finance.`,
      );
    if (columns.has(name as Header))
      fail(header.line, `colonne « ${name} » en doublon.`);
    columns.set(name as Header, i);
  }
  for (const name of REQUIRED)
    if (!columns.has(name))
      fail(header.line, `colonne obligatoire absente : ${name}.`);
  if (!rows.length) fail(header.line, "aucune opération à importer.");
  const incoming = {
    ...emptyData(),
    accounts: existing.accounts,
    preferences: { ...existing.preferences },
    importedAt: new Date().toISOString(),
  };
  const accounts = new Map(
    existing.accounts.map((account) => [account.id, account]),
  );
  const ids = new Map<string, number>();
  for (const row of rows) {
    if (row.cells.length !== names.length)
      fail(
        row.line,
        `${names.length} colonnes attendues, ${row.cells.length} reçues. Un montant avec virgule doit être entre guillemets si le séparateur est une virgule.`,
      );
    const get = (name: Header) =>
      columns.has(name) ? row.cells[columns.get(name)!].trim() : "";
    const externalId = get("externalId");
    if (
      !externalId ||
      externalId.length > 196 ||
      !/^[A-Za-z0-9_:.@/-]+$/.test(externalId)
    ) {
      fail(
        row.line,
        "externalId obligatoire, stable et unique : lettres sans accent, chiffres ou _ : . @ / -, maximum 196 caractères.",
      );
    }
    if (ids.has(externalId))
      fail(
        row.line,
        `externalId « ${externalId} » en doublon avec la ligne ${ids.get(externalId)}.`,
      );
    ids.set(externalId, row.line);
    const id = `csv:${externalId}`;
    const label = get("label");
    if (!label || label.length > 300)
      fail(row.line, "label obligatoire, maximum 300 caractères.");
    const kind = get("kind");
    if (!["income", "expense", "transfer"].includes(kind))
      fail(row.line, "kind doit valoir income, expense ou transfer.");
    const status = get("status") || "unknown";
    if (!["planned", "settled", "unknown"].includes(status))
      fail(
        row.line,
        "status doit valoir planned, settled ou unknown ; vide signifie unknown.",
      );
    const currency = get("currency");
    if (!/^[A-Z]{3}$/.test(currency))
      fail(
        row.line,
        "currency doit contenir trois lettres majuscules, par exemple CHF.",
      );
    const amount = (name: "amount" | "destinationAmount"): number => {
      try {
        const value = get(name);
        if (value.length > 128)
          fail(row.line, `${name} dépasse la longueur monétaire acceptée.`);
        const parsed = parseMoney(value);
        if (parsed < 0)
          fail(
            row.line,
            `${name} doit être positif ou nul. La colonne kind définit le sens de l’opération.`,
          );
        return parsed;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "montant invalide.";
        if (message.startsWith("CSV, ligne ")) throw error;
        return fail(row.line, `${name} : ${message}`);
      }
    };
    const date = get("date") || null;
    if (date !== null && !isDate(date))
      fail(
        row.line,
        "date invalide ; utilisez YYYY-MM-DD ou laissez vide si elle est inconnue.",
      );
    const budgetMonth = get("budgetMonth");
    if (budgetMonth && !/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(budgetMonth))
      fail(
        row.line,
        "budgetMonth invalide ; utilisez YYYY-MM ou laissez vide.",
      );
    const accountId = get("accountId") || null;
    const destinationAccountId = get("destinationAccountId") || null;
    if (accountId && !accounts.has(accountId))
      fail(
        row.line,
        `accountId « ${accountId} » introuvable. Créez le compte d’abord ou laissez vide.`,
      );
    if (destinationAccountId && !accounts.has(destinationAccountId))
      fail(
        row.line,
        `destinationAccountId « ${destinationAccountId} » introuvable.`,
      );
    if (accountId && accounts.get(accountId)!.currency !== currency)
      fail(row.line, "currency est différente de la devise du compte source.");
    const amountMinor = amount("amount");
    const destinationAmountMinor = get("destinationAmount")
      ? amount("destinationAmount")
      : null;
    if (
      kind !== "transfer" &&
      (destinationAccountId !== null || destinationAmountMinor !== null)
    )
      fail(
        row.line,
        "les colonnes destination sont réservées aux virements (transfer).",
      );
    if (kind === "transfer") {
      if (
        !accountId ||
        !destinationAccountId ||
        accountId === destinationAccountId
      )
        fail(
          row.line,
          "un virement exige deux comptes existants et distincts.",
        );
      if (
        accounts.get(destinationAccountId)!.currency !== currency &&
        destinationAmountMinor === null
      )
        fail(
          row.line,
          "destinationAmount est obligatoire pour un virement entre devises différentes.",
        );
      if (
        accounts.get(destinationAccountId)!.currency === currency &&
        destinationAmountMinor !== null &&
        destinationAmountMinor !== amountMinor
      )
        fail(
          row.line,
          "un virement dans la même devise doit conserver le montant ; enregistrez les frais séparément.",
        );
    }
    incoming.transactions.push({
      id,
      label,
      kind: kind as Transaction["kind"],
      amountMinor,
      currency,
      status: status as Transaction["status"],
      date,
      ...(budgetMonth ? { budgetMonth } : {}),
      accountId,
      category: "",
      ...(kind === "transfer"
        ? { destinationAccountId, destinationAmountMinor }
        : {}),
      source: {
        system: "import",
        sourceId: id,
        importedAt: incoming.importedAt,
        note: "Import CSV Finance",
      },
    });
  }
  try {
    return validateData(incoming);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "données invalides.";
    const index = message.match(/transactions\[(\d+)\]/)?.[1];
    if (index !== undefined && rows[Number(index)])
      fail(rows[Number(index)].line, message);
    throw new Error(`Import CSV : ${message}`);
  }
}
