import { describe, expect, it } from "vitest";
import { recurrenceAmountFields } from "./Editor";
import { today, withRecurrenceAmount } from "../domain/finance";
import { type Recurrence } from "../domain/types";

// Ciblé sur le chemin exact emprunté par Editor.tsx en soumettant le formulaire de
// récurrence : recurrenceAmountFields() est la fonction que le bloc
// `if (spec.type === "recurrence")` appelle pour fusionner amountMinor/amountEffectiveFrom/
// amountHistory avant de construire l'objet récurrence sauvegardé. Avant le correctif, ce
// bloc lisait `amountMinor: num("amountMinor")` directement et remplaçait tout l'objet, ce
// qui effaçait silencieusement amountHistory à chaque sauvegarde.

const source = { system: "manual" as const };
const recurrence = (extra: Partial<Recurrence> = {}): Recurrence => ({
  id: "sub",
  label: "Abonnement",
  kind: "expense",
  recurrenceType: "subscription",
  amountMinor: 2000,
  currency: "CHF",
  accountId: "bank",
  category: "Abonnements",
  day: 1,
  intervalMonths: 1,
  startDate: "2026-01-01",
  active: true,
  source,
  ...extra,
});

describe("recurrenceAmountFields (chemin de sauvegarde de l'éditeur de récurrence)", () => {
  it("ne perd pas l'historique quand une récurrence existante est resauvegardée sans changer le montant", () => {
    // Première sauvegarde depuis l'éditeur : une vraie hausse de prix.
    const rule = recurrence();
    const raised = withRecurrenceAmount(rule, 3000, "2026-06-01");
    expect(raised.amountHistory).toEqual([
      { amountMinor: 2000, effectiveFrom: "2026-01-01" },
    ]);
    expect(raised.amountEffectiveFrom).toBe("2026-06-01");
    // Deuxième sauvegarde depuis l'éditeur (ex. correction du libellé), montant inchangé
    // (3000). Avant le correctif, Editor.tsx écrasait l'objet en lisant amountMinor
    // directement, ce qui effaçait amountHistory et amountEffectiveFrom à chaque sauvegarde.
    const savedAgain = recurrenceAmountFields(raised, 3000);
    expect(savedAgain.amountMinor).toBe(3000);
    expect(savedAgain.amountEffectiveFrom).toBe("2026-06-01");
    expect(savedAgain.amountHistory).toEqual([
      { amountMinor: 2000, effectiveFrom: "2026-01-01" },
    ]);
    // Une troisième sauvegarde, toujours à montant inchangé, ne doit rien ajouter de plus.
    const savedAThirdTime = recurrenceAmountFields(raised, 3000);
    expect(savedAThirdTime.amountHistory).toHaveLength(1);
  });

  it("date et archive correctement une vraie hausse de prix sur une récurrence existante", () => {
    const rule = recurrence({ startDate: "2026-01-01" });
    const changed = recurrenceAmountFields(rule, 5000);
    expect(changed.amountMinor).toBe(5000);
    // Aucun champ de date d'effet dans le formulaire : la date d'effet est automatiquement
    // "aujourd'hui", comme encodé dans withRecurrenceAmount.
    expect(changed.amountEffectiveFrom).toBe(today());
    expect(changed.amountHistory).toEqual([
      { amountMinor: 2000, effectiveFrom: "2026-01-01" },
    ]);
  });

  it("ne porte aucun historique pour une nouvelle récurrence (pas d'item existant)", () => {
    const created = recurrenceAmountFields(undefined, 1500);
    expect(created).toEqual({ amountMinor: 1500 });
  });
});
