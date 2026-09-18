/** Business-data migrations, separate from the vault's cryptographic envelope version
 * (see `vault.ts`), which these never touch. Each step is pure (no I/O) and idempotent:
 * running it again on its own output is a no-op. `validateData` runs this before structural
 * validation so an old coffre/export keeps opening; on any failure downstream, the caller's
 * original data is left untouched (see `vault.ts` restore/import paths). */

export const CURRENT_DATA_VERSION = 2;

type Obj = Record<string, unknown>;
function isPlainObject(value: unknown): value is Obj {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Version 1 recurrences had no classification. A migrated value only ever gains an explicit
 * `recurrenceType`; nothing else about the recurrence changes. Income keeps its nature exactly
 * (`kind` already distinguished it). Only the explicit legacy category `Abonnements` becomes
 * `subscription` — no other guess is made about bill/saving, matching
 * `docs/CORRESPONDANCE_NOTION.md`'s rule against inventing a classification. Everything else
 * lands in `other`, the documented "migrated value to verify" bucket. */
function migrateRecurrenceToV2(entry: unknown): unknown {
  if (!isPlainObject(entry) || "recurrenceType" in entry) return entry;
  const recurrenceType =
    entry.kind === "income"
      ? "income"
      : entry.category === "Abonnements"
        ? "subscription"
        : "other";
  return { ...entry, recurrenceType };
}

/** Upgrades raw, untrusted JSON from version 1 to the current version before `validateData`'s
 * structural checks run. Returns the input unchanged for the current version already, and for
 * anything else it does not recognize — `validateData` rejects those with its normal error. */
export function migrateToCurrentVersion(input: unknown): unknown {
  if (!isPlainObject(input)) return input;
  if (input.version === CURRENT_DATA_VERSION) return input;
  if (input.version !== 1) return input;
  // A malformed `recurrences` (missing, not an array, ...) is left exactly as-is rather than
  // defaulted to `[]` — silently replacing it would turn a corrupt file that `validateData`
  // must reject into one that quietly opens with its recurrences dropped.
  return {
    ...input,
    version: CURRENT_DATA_VERSION,
    recurrences: Array.isArray(input.recurrences)
      ? input.recurrences.map(migrateRecurrenceToV2)
      : input.recurrences,
  };
}
