import { describe, expect, it } from "vitest";
import { CURRENT_DATA_VERSION, migrateToCurrentVersion } from "./migration";
import { emptyData } from "./types";

const source = { system: "manual" as const };
// Deliberately untyped: this is what a version-1 export actually looked like on disk,
// before `recurrenceType` existed — not a valid current `Recurrence`.
const legacyRecurrence = (extra: Record<string, unknown> = {}) => ({
  id: "old-sub",
  label: "Streaming",
  kind: "expense",
  amountMinor: 1500,
  currency: "CHF",
  accountId: null,
  category: "Abonnements",
  day: 5,
  intervalMonths: 1,
  startDate: "2020-01-05",
  active: true,
  source,
  ...extra,
});
const legacy = (recurrences: unknown[] = []) => ({
  ...emptyData(),
  version: 1,
  recurrences,
});

describe("migrateToCurrentVersion", () => {
  it("laisse une entrée déjà à la version courante strictement inchangée (référence identique)", () => {
    const current = { ...emptyData(), recurrences: [] };
    expect(migrateToCurrentVersion(current)).toBe(current);
  });
  it("ne touche pas une entrée qui n'est ni un objet ni une version 1 reconnue", () => {
    for (const input of [null, undefined, "x", 42, [], { version: 3 }, { version: "1" }])
      expect(migrateToCurrentVersion(input)).toEqual(input);
  });
  it("classe un revenu récurrent version 1 comme income, quelle que soit sa catégorie", () => {
    const migrated = migrateToCurrentVersion(
      legacy([legacyRecurrence({ kind: "income", category: "Salaire" })]),
    ) as { version: number; recurrences: { recurrenceType: string }[] };
    expect(migrated.version).toBe(CURRENT_DATA_VERSION);
    expect(migrated.recurrences[0].recurrenceType).toBe("income");
  });
  it("classe une dépense de catégorie exactement « Abonnements » comme subscription", () => {
    const migrated = migrateToCurrentVersion(
      legacy([legacyRecurrence({ category: "Abonnements" })]),
    ) as { recurrences: { recurrenceType: string }[] };
    expect(migrated.recurrences[0].recurrenceType).toBe("subscription");
  });
  it("ne devine pas bill/saving : toute autre dépense migre en other, à vérifier", () => {
    for (const category of ["Assurances", "Loyer", "Abonnement", " Abonnements", ""]) {
      const migrated = migrateToCurrentVersion(
        legacy([legacyRecurrence({ category })]),
      ) as { recurrences: { recurrenceType: string }[] };
      expect(migrated.recurrences[0].recurrenceType).toBe("other");
    }
  });
  it("ne modifie aucun autre champ de la récurrence", () => {
    const original = legacyRecurrence();
    const migrated = migrateToCurrentVersion(legacy([original])) as {
      recurrences: Record<string, unknown>[];
    };
    const { recurrenceType, ...rest } = migrated.recurrences[0];
    expect(recurrenceType).toBe("subscription");
    expect(rest).toEqual(original);
  });
  it("est idempotente : une deuxième migration ne change plus rien", () => {
    const once = migrateToCurrentVersion(
      legacy([legacyRecurrence({ kind: "income", category: "Salaire" })]),
    );
    const twice = migrateToCurrentVersion(once);
    expect(twice).toEqual(once);
    // A recurrence that already carries a classification is never reclassified, even one
    // that a fresh migration would have picked differently — the presence of the field
    // alone is what makes a rerun a no-op.
    const alreadyClassified = legacy([
      legacyRecurrence({ category: "Abonnements", recurrenceType: "other" }),
    ]);
    const result = migrateToCurrentVersion(alreadyClassified) as {
      recurrences: { recurrenceType: string }[];
    };
    expect(result.recurrences[0].recurrenceType).toBe("other");
  });
  it("laisse un champ recurrences corrompu (absent, non tableau) inchangé plutôt que de le vider silencieusement", () => {
    // A silently substituted [] would let validateData accept a corrupted file with its
    // recurrences dropped instead of rejecting it, as a corrupt import must be.
    for (const corrupt of [{ hack: true }, "oops", null, 42]) {
      const migrated = migrateToCurrentVersion(
        legacy(corrupt as unknown as unknown[]),
      ) as Record<string, unknown>;
      expect(migrated.recurrences).toBe(corrupt);
    }
    const missing = legacy() as Record<string, unknown>;
    delete missing.recurrences;
    const migrated = migrateToCurrentVersion(missing) as Record<string, unknown>;
    expect(migrated.recurrences).toBeUndefined();
  });
  it("ne touche pas les autres listes ni les préférences", () => {
    const withAccounts = {
      ...legacy([]),
      accounts: [{ id: "a" }],
      preferences: { baseCurrency: "USD", locale: "fr-CH" },
    };
    const migrated = migrateToCurrentVersion(withAccounts) as Record<
      string,
      unknown
    >;
    expect(migrated.accounts).toBe(withAccounts.accounts);
    expect(migrated.preferences).toBe(withAccounts.preferences);
  });
});
