import type {
  Account,
  Balance,
  FinanceData,
  FxRate,
  Transaction,
} from "./types";

const MAX = BigInt(Number.MAX_SAFE_INTEGER);
const MIN = -MAX;
function safeNumber(value: bigint): number {
  if (value < MIN || value > MAX)
    throw new Error("Le montant dépasse la précision sûre.");
  return Number(value);
}
function sum(values: number[]): number {
  return safeNumber(values.reduce((total, value) => total + BigInt(value), 0n));
}

/** Money is stored in integer hundredths; null is an explicitly unknown amount. */
export function money(minor: number | null, currency = "CHF"): string {
  if (minor === null) return "—";
  if (!Number.isSafeInteger(minor))
    throw new Error("Montant monétaire invalide.");
  const absolute = BigInt(minor < 0 ? -minor : minor);
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  const formatted = new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .formatToParts(absolute / 100n)
    .map((part) => (part.type === "fraction" ? fraction : part.value))
    .join("");
  return `${minor < 0 ? "-" : ""}${formatted}`;
}

/** Strict decimal parsing. Accepts Swiss grouping (1’234.50) and French decimals (1 234,50). */
export function parseMoney(input: string): number {
  const raw = input
    .trim()
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[’‘]/g, "'");
  if (!raw) throw new Error("Indiquez un montant.");
  const match = raw.match(
    /^([+-]?)(\d+|\d{1,3}(?: \d{3})+|\d{1,3}(?:'\d{3})+)(?:[.,](\d+))?$/,
  );
  if (!match) throw new Error("Montant invalide. Exemple : 1’234.50.");
  if ((match[3]?.length ?? 0) > 2)
    throw new Error("Deux décimales maximum ; aucun arrondi implicite.");
  const whole = match[2].replace(/[ ']/g, "");
  const value = BigInt(whole) * 100n + BigInt((match[3] ?? "").padEnd(2, "0"));
  return safeNumber(match[1] === "-" ? -value : value);
}

/** Local calendar day (never UTC slicing, which changes the day around midnight). */
export function today(): string {
  const date = new Date();
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
function monthParts(month: string): [number, number] {
  if (!/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("Mois invalide.");
  return [Number(month.slice(0, 4)), Number(month.slice(5, 7))];
}
export function monthLabel(month: string): string {
  monthParts(month);
  return new Intl.DateTimeFormat("fr-CH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
}
function daysInMonth(year: number, month: number): number {
  return month === 2
    ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
      ? 29
      : 28
    : [4, 6, 9, 11].includes(month)
      ? 30
      : 31;
}

/** A balance observation requires its own date. Import dates never substitute for asOf. */
export function latestBalance(account: Account, at = today()): Balance | null {
  if (!isDate(at)) throw new Error("Date d’évaluation invalide.");
  return account.balances.reduce<Balance | null>(
    (latest, balance) =>
      balance.asOf !== null &&
      isDate(balance.asOf) &&
      balance.asOf <= at &&
      (!latest || balance.asOf >= latest.asOf!)
        ? balance
        : latest,
    null,
  );
}

/** Virtual planned occurrences are replaced by an explicit transaction linked to that occurrence,
 * even if its payment date moves to another month. Only actual transaction dates determine cash month. */
export function transactionsForMonth(
  data: FinanceData,
  month: string,
): Transaction[] {
  const [year, monthNumber] = monthParts(month);
  const result = data.transactions.filter(
    (transaction) =>
      (transaction.date?.slice(0, 7) ?? transaction.budgetMonth) === month,
  );
  const linked = new Set(
    data.transactions
      .filter((t) => t.recurrenceId && t.occurrenceDate)
      .map((t) => `${t.recurrenceId}:${t.occurrenceDate}`),
  );
  for (const recurrence of data.recurrences) {
    if (!recurrence.active) continue;
    const [startYear, startMonth] = monthParts(
      recurrence.startDate.slice(0, 7),
    );
    const distance = (year - startYear) * 12 + monthNumber - startMonth;
    if (distance < 0 || distance % recurrence.intervalMonths !== 0) continue;
    const date = `${month}-${String(Math.min(recurrence.day, daysInMonth(year, monthNumber))).padStart(2, "0")}`;
    if (
      date < recurrence.startDate ||
      (recurrence.endDate && date > recurrence.endDate) ||
      linked.has(`${recurrence.id}:${date}`)
    )
      continue;
    const id = `${recurrence.id}:${date}`;
    // ID matching is a second guard for older exports that have not persisted the link fields.
    if (data.transactions.some((transaction) => transaction.id === id))
      continue;
    result.push({
      id,
      label: recurrence.label,
      kind: recurrence.kind,
      amountMinor: recurrence.amountMinor,
      currency: recurrence.currency,
      status: "planned",
      date,
      accountId: recurrence.accountId,
      category: recurrence.category,
      recurrenceId: recurrence.id,
      occurrenceDate: date,
      source: recurrence.source,
    });
  }
  return result.sort(
    (a, b) =>
      (a.date ?? "").localeCompare(b.date ?? "") || a.id.localeCompare(b.id),
  );
}

function rateFraction(rate: string): [bigint, bigint] {
  if (!/^\d{1,24}(?:\.\d{1,18})?$/.test(rate))
    throw new Error("Taux de change décimal invalide.");
  const [whole, decimal = ""] = rate.split(".");
  const numerator = BigInt(whole + decimal);
  if (numerator <= 0n) throw new Error("Le taux de change doit être positif.");
  return [numerator, 10n ** BigInt(decimal.length)];
}
function roundRatio(numerator: bigint, denominator: bigint): number {
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  return safeNumber(sign * ((absolute + denominator / 2n) / denominator));
}

/** Exact rational FX, round half away from zero once to a hundredth. Direct/inverse only;
 * missing dated rates return null. No 1:1 assumption, triangulation or future rates. */
export function convertMinor(
  amount: number,
  from: string,
  to: string,
  rates: FxRate[],
  at = today(),
): number | null {
  if (!Number.isSafeInteger(amount))
    throw new Error("Montant monétaire invalide.");
  if (!isDate(at)) throw new Error("Date de conversion invalide.");
  if (from === to) return amount;
  const rate = rates
    .filter(
      (r) =>
        r.asOf <= at &&
        ((r.from === from && r.to === to) || (r.from === to && r.to === from)),
    )
    .sort(
      (a, b) => b.asOf.localeCompare(a.asOf) || (a.from === from ? -1 : 1),
    )[0];
  if (!rate) return null;
  const [numerator, denominator] = rateFraction(rate.rate);
  return rate.from === from
    ? roundRatio(BigInt(amount) * numerator, denominator)
    : roundRatio(BigInt(amount) * denominator, numerator);
}

export type MonthSummary = {
  incomePlanned: number | null;
  incomeSettled: number | null;
  expensePlanned: number | null;
  expenseSettled: number | null;
  /** Monthly projection, never a bank balance or spendable money. Unknown perimeter gives null. */
  remaining: number | null;
  unknownCount: number;
};
export function monthSummary(
  data: FinanceData,
  month: string,
  currency: string,
): MonthSummary {
  const buckets = {
    incomePlanned: [] as number[],
    incomeSettled: [] as number[],
    expensePlanned: [] as number[],
    expenseSettled: [] as number[],
  };
  // Undated income/expense cannot be assigned to a month: disclose incomplete projection.
  let unknownCount =
    data.transactions.filter(
      (t) => t.kind !== "transfer" && t.date === null && !t.budgetMonth,
    ).length + data.reviewItems.length;
  for (const transaction of transactionsForMonth(data, month)) {
    if (transaction.kind === "transfer") continue;
    // A budget month is not evidence of the month in which money was settled.
    if (
      transaction.status === "unknown" ||
      (transaction.status === "settled" && transaction.date === null)
    ) {
      unknownCount++;
      continue;
    }
    const amount =
      transaction.currency === currency
        ? transaction.amountMinor
        : transaction.date === null
          ? null
          : convertMinor(
              transaction.amountMinor,
              transaction.currency,
              currency,
              data.fxRates,
              transaction.date,
            );
    if (amount === null) {
      unknownCount++;
      continue;
    }
    const key =
      `${transaction.kind}${transaction.status === "settled" ? "Settled" : "Planned"}` as keyof typeof buckets;
    buckets[key].push(amount);
  }
  const hasIncome =
    buckets.incomePlanned.length + buckets.incomeSettled.length > 0;
  const hasExpense =
    buckets.expensePlanned.length + buckets.expenseSettled.length > 0;
  const incomePlanned = hasIncome ? sum(buckets.incomePlanned) : null,
    incomeSettled = hasIncome ? sum(buckets.incomeSettled) : null;
  const expensePlanned = hasExpense ? sum(buckets.expensePlanned) : null,
    expenseSettled = hasExpense ? sum(buckets.expenseSettled) : null;
  return {
    incomePlanned,
    incomeSettled,
    expensePlanned,
    expenseSettled,
    remaining:
      unknownCount || !hasIncome || !hasExpense
        ? null
        : sum([
            incomePlanned!,
            incomeSettled!,
            -expensePlanned!,
            -expenseSettled!,
          ]),
    unknownCount,
  };
}

export type WealthSummary = {
  totalMinor: number | null;
  partial: boolean;
  excluded: number;
  items: { accountId: string; valueMinor: number | null }[];
};
/** total: balance is the full account value. components: balance is cash, plus positions.
 * A missing component invalidates that account, rather than pretending it is zero. */
export function wealthSummary(
  data: FinanceData,
  currency: string,
  at = today(),
): WealthSummary {
  if (!isDate(at)) throw new Error("Date d’évaluation invalide.");
  const items = data.accounts.map((account) => {
    const observation = latestBalance(account, at);
    let valueMinor =
      observation?.amountMinor == null
        ? null
        : convertMinor(
            observation.amountMinor,
            account.currency,
            currency,
            data.fxRates,
            at,
          );
    if (account.valuationMode === "components") {
      const parts: number[] = valueMinor === null ? [] : [valueMinor];
      let incomplete = valueMinor === null;
      for (const position of data.positions.filter(
        (p) => p.accountId === account.id,
      )) {
        const value =
          position.asOf === null ||
          position.asOf > at ||
          position.valueMinor === null
            ? null
            : convertMinor(
                position.valueMinor,
                position.currency,
                currency,
                data.fxRates,
                at,
              );
        if (value === null) incomplete = true;
        else parts.push(value);
      }
      valueMinor = incomplete ? null : sum(parts);
    }
    if (valueMinor !== null && account.kind === "debt")
      valueMinor = -Math.abs(valueMinor);
    return { accountId: account.id, valueMinor };
  });
  const known = items.flatMap((item) =>
    item.valueMinor === null ? [] : [item.valueMinor],
  );
  const excluded = items.length - known.length;
  return {
    totalMinor: known.length ? sum(known) : null,
    partial: excluded > 0 || items.length === 0,
    excluded,
    items,
  };
}

export type AvailableSummary = {
  amountMinor: number | null;
  asOf: string | null;
  partial: boolean;
};
/** Conservative current bank cash projection. Only today's observed balances may be called
 * available; historical balances remain visible in wealth, with their original date. */
export function availableSummary(
  data: FinanceData,
  currency: string,
  month: string,
): AvailableSummary {
  monthParts(month);
  const at = today();
  const unknown: AvailableSummary = {
    amountMinor: null,
    asOf: null,
    partial: true,
  };
  if (month !== at.slice(0, 7) || data.reviewItems.length > 0) return unknown;
  const banks = data.accounts.filter((a) => a.kind === "bank");
  if (!banks.length) return unknown;
  const ids = new Set(banks.map((a) => a.id));
  const amounts: number[] = [];
  for (const bank of banks) {
    const balance = latestBalance(bank, at);
    if (!balance || balance.asOf !== at || balance.amountMinor === null)
      return unknown;
    const value = convertMinor(
      balance.amountMinor,
      bank.currency,
      currency,
      data.fxRates,
      at,
    );
    if (value === null) return unknown;
    amounts.push(value);
  }
  // An unallocated reserve cannot safely be assumed to concern another account.
  for (const goal of data.goals.filter(
    (g) => g.accountId === null || ids.has(g.accountId),
  )) {
    if (
      goal.accountId === null ||
      goal.reservedMinor === null ||
      goal.asOf === null ||
      goal.asOf > at
    )
      return unknown;
    const value = convertMinor(
      goal.reservedMinor,
      goal.currency,
      currency,
      data.fxRates,
      at,
    );
    if (value === null) return unknown;
    amounts.push(-value);
  }
  if (
    data.transactions.some(
      (t) => t.kind !== "income" && t.status !== "settled" && t.date === null,
    )
  )
    return unknown;
  // An undated settlement cannot be reconciled to the observed balance; a day-only
  // balance also cannot establish whether it includes a settlement on that same day.
  if (
    data.transactions.some(
      (t) =>
        t.status === "settled" &&
        (t.date === null || t.date === at) &&
        (t.accountId === null ||
          ids.has(t.accountId) ||
          (t.destinationAccountId && ids.has(t.destinationAccountId))),
    )
  )
    return unknown;
  const commitments = transactionsForMonth(data, month);
  // Keep explicit prior-month unpaid commitments until the user settles or removes them.
  commitments.push(
    ...data.transactions.filter(
      (t) =>
        t.date !== null && t.date.slice(0, 7) < month && t.status !== "settled",
    ),
  );
  // Older virtual occurrences are not proof of either payment or a remaining liability.
  // Require reconciliation of them before making a spendable-money claim.
  const reconciledOccurrences = new Set(
    data.transactions
      .filter((t) => t.recurrenceId && t.occurrenceDate)
      .map((t) => `${t.recurrenceId}:${t.occurrenceDate}`),
  );
  for (const recurrence of data.recurrences.filter(
    (r) =>
      r.active &&
      r.kind === "expense" &&
      (r.accountId === null || ids.has(r.accountId)),
  )) {
    const [startYear, startMonth] = monthParts(
      recurrence.startDate.slice(0, 7),
    );
    const [targetYear, targetMonth] = monthParts(month);
    const monthCount = (targetYear - startYear) * 12 + targetMonth - startMonth;
    for (
      let offset = 0, inspected = 0;
      offset < monthCount;
      offset += recurrence.intervalMonths
    ) {
      if (++inspected > 1200) return unknown;
      const absoluteMonth = startYear * 12 + startMonth - 1 + offset;
      const year = Math.floor(absoluteMonth / 12),
        monthNumber = (absoluteMonth % 12) + 1;
      const due = `${String(year).padStart(4, "0")}-${String(monthNumber).padStart(2, "0")}-${String(Math.min(recurrence.day, daysInMonth(year, monthNumber))).padStart(2, "0")}`;
      if (due < recurrence.startDate) continue;
      if (recurrence.endDate && due > recurrence.endDate) break;
      if (!reconciledOccurrences.has(`${recurrence.id}:${due}`)) return unknown;
    }
  }
  for (const transaction of commitments) {
    if (transaction.kind === "income" || transaction.status === "settled")
      continue;
    if (transaction.accountId === null) return unknown;
    if (!ids.has(transaction.accountId)) continue;
    if (transaction.status === "unknown") return unknown;
    // Past unpaid planned expenses are still commitments, including overdue ones this month.
    if (
      transaction.kind === "transfer" &&
      transaction.destinationAccountId &&
      ids.has(transaction.destinationAccountId)
    )
      continue;
    const value = convertMinor(
      transaction.amountMinor,
      transaction.currency,
      currency,
      data.fxRates,
      at,
    );
    if (value === null) return unknown;
    amounts.push(-value);
  }
  return { amountMinor: sum(amounts), asOf: at, partial: false };
}
