import { test, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const passphrase = "Exemple-test-Finance-2026"; // Synthetic test credential; never used for a real vault.
test("private vault: account, dated balance, operation, lock, wrong password, reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Créer mon espace privé" }),
  ).toBeVisible();
  await page.getByLabel("Phrase secrète", { exact: true }).fill(passphrase);
  await page.getByLabel("Confirmer la phrase secrète").fill(passphrase);
  await page.getByRole("button", { name: "Créer mon coffre" }).click();
  await page
    .getByRole("navigation", { name: "Navigation principale", exact: true })
    .getByRole("button", { name: "Mes comptes", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nom du compte").fill("Banque exemple test");
  await dialog.getByLabel("Établissement").fill("Banque Fictive");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(
    page.getByText("Banque exemple test", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Solde observé").fill("1234.56");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.locator(".balance")).toContainText("1");
  await page
    .getByRole("navigation", { name: "Navigation principale", exact: true })
    .getByRole("button", { name: "Mon mois", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Libellé").fill("Dépense synthétique");
  await dialog.getByLabel("Montant", { exact: true }).fill("42.10");
  await dialog
    .getByLabel("Compte", { exact: true })
    .selectOption({ label: "Banque exemple test · CHF" });
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(
    page.getByText("Dépense synthétique", { exact: true }),
  ).toBeVisible();
  const storage = await page.evaluate(() =>
    Object.values(localStorage).join(""),
  );
  expect(storage).not.toContain("Banque exemple test");
  expect(storage).not.toContain("Dépense synthétique");
  await page
    .getByRole("button", { name: "Verrouiller l’espace", exact: true })
    .click();
  await expect(page.getByText("Banque exemple test")).toHaveCount(0);
  await page
    .getByLabel("Phrase secrète", { exact: true })
    .fill("phrase-incorrecte");
  await page
    .getByRole("button", { name: "Déverrouiller", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Phrase secrète", { exact: true }).fill(passphrase);
  await page
    .getByRole("button", { name: "Déverrouiller", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mon mois", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ouvrir mon espace" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("real rendered demo screenshots at desktop, tablet and mobile; pages, privacy and overflow", async ({
  page,
}) => {
  await mkdir("docs/captures", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.screenshot({
    path: "docs/captures/01-coffre-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Voir la démonstration" }).click();
  await expect(
    page.getByText(
      "Démonstration · Tous les montants et établissements sont fictifs.",
    ),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/captures/02-finance-desktop.png",
    fullPage: true,
  });
  for (const name of [
    "Mon mois",
    "Mes comptes",
    "Épargne et projets",
    "Investissements",
    "Documents et réglages",
  ]) {
    await page
      .getByRole("navigation", { name: "Navigation principale", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("navigation", { name: "Navigation principale", exact: true })
    .getByRole("button", { name: "Vue d’ensemble" })
    .click();
  await page.getByRole("button", { name: "Masquer les montants" }).click();
  await expect(page.locator(".hero-value").first()).toHaveText("••••••");
  await expect(
    page.locator('svg[aria-label="Répartition des actifs positifs"]'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Afficher les montants" }).click();
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.screenshot({
    path: "docs/captures/03-finance-ipad.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/captures/04-finance-iphone.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation", { name: "Navigation mobile" })
    .getByRole("button", { name: "Plus" })
    .click();
  await page
    .locator(".mobile-more")
    .getByRole("button", { name: "Épargne et projets" })
    .click();
  await page.screenshot({
    path: "docs/captures/05-projets-iphone.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Un projet" })).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fermer", exact: true })
    .click();
  // Exercise the actual CSV input, preview and merge with fictitious data.
  await page.setViewportSize({ width: 1440, height: 1000 });
  const navigation = page.getByRole("navigation", {
    name: "Navigation principale",
    exact: true,
  });
  const month = new Date().toISOString().slice(0, 7);
  const csv = Buffer.from(
    `externalId;label;kind;amount;currency;status;date;budgetMonth;accountId\n` +
      `TEST_CSV_UI;Import CSV fictif;expense;19.95;CHF;planned;;${month};demo-bank\n`,
  );
  for (let attempt = 0; attempt < 2; attempt++) {
    await navigation
      .getByRole("button", { name: "Documents et réglages", exact: true })
      .click();
    await page
      .locator('input[type="file"][accept=".json,.csv"]')
      .setInputFiles({
        name: "test-fictif.csv",
        mimeType: "text/csv",
        buffer: csv,
      });
    await expect(
      page.getByText("Vérifier cet import", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Confirmer l’import", exact: true })
      .click();
    await expect(
      page.getByText("Vérifier cet import", { exact: true }),
    ).toHaveCount(0);
    await navigation
      .getByRole("button", { name: "Mon mois", exact: true })
      .click();
    await expect(
      page.getByText("Import CSV fictif", { exact: true }),
    ).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});
test("daily entries: income, currency-synced transfer, recurrence, investment-only position picker, receipt from a row", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Phrase secrète", { exact: true }).fill(passphrase);
  await page.getByLabel("Confirmer la phrase secrète").fill(passphrase);
  await page.getByRole("button", { name: "Créer mon coffre" }).click();
  const nav = page.getByRole("navigation", {
    name: "Navigation principale",
    exact: true,
  });
  async function newAccount(name: string, institution: string, ccy: string) {
    await nav.getByRole("button", { name: "Mes comptes", exact: true }).click();
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nom du compte").fill(name);
    await dialog.getByLabel("Établissement").fill(institution);
    if (ccy !== "CHF")
      await dialog.getByLabel("Devise", { exact: true }).selectOption(ccy);
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await newAccount("Compte principal test", "Banque Fictive", "CHF");
  await newAccount("Compte voyage test", "Banque Fictive", "EUR");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nom du compte").fill("Portefeuille test");
  await dialog.getByLabel("Établissement").fill("Courtier Fictif");
  await dialog.getByLabel("Type", { exact: true }).selectOption("investment");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // 1) Income, confirmed as received, then a receipt attached directly from its row
  // (no navigation needed; a settled row is where a receipt is actually in hand).
  await nav.getByRole("button", { name: "Mon mois", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.locator('select[name="kind"]').selectOption("income");
  await dialog.getByLabel("Libellé").fill("Salaire synthétique test");
  await dialog.getByLabel("Montant", { exact: true }).fill("3000");
  await dialog
    .getByLabel("Compte", { exact: true })
    .selectOption({ label: "Compte principal test · CHF" });
  await dialog.getByLabel("État", { exact: true }).selectOption({ label: "Reçu" });
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const incomeRow = page.locator(".row", {
    hasText: "Salaire synthétique test",
  });
  await incomeRow
    .getByRole("button", {
      name: "Joindre un document à Salaire synthétique test",
    })
    .setInputFiles({
      name: "recu-test-fictif.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(incomeRow).toContainText("Justificatif joint");
  await nav
    .getByRole("button", { name: "Documents et réglages", exact: true })
    .click();
  await expect(
    page
      .locator(".row", { hasText: "recu-test-fictif.png" })
      .getByText("Salaire synthétique test", { exact: false }),
  ).toBeVisible();

  // 2) Recurrence: currency prefilled from the chosen account, no duplicate entry.
  // Created and edited from the dedicated Abonnements page, which owns recurrence
  // management; Mon mois only previews active recurrences and links out to it.
  await nav.getByRole("button", { name: "Abonnements", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Libellé", { exact: true }).fill("Assurance test");
  // Nature must survive a Type round trip: choosing "Charge" and then switching
  // Type to Revenu and back to Dépense must not silently fall back to "Abonnement".
  await dialog
    .getByLabel("Nature", { exact: true })
    .selectOption("bill");
  await dialog.getByLabel("Type", { exact: true }).selectOption("income");
  await dialog.getByLabel("Type", { exact: true }).selectOption("expense");
  await expect(dialog.getByLabel("Nature", { exact: true })).toHaveValue(
    "bill",
  );
  await dialog.getByLabel("Montant", { exact: true }).fill("45");
  await dialog
    .getByLabel("Compte", { exact: true })
    .selectOption({ label: "Compte principal test · CHF" });
  await expect(dialog.getByLabel("Devise", { exact: true })).toHaveValue(
    "CHF",
  );
  await dialog.getByLabel("Catégorie", { exact: true }).fill("Assurances");
  await dialog.getByLabel("Jour du mois", { exact: true }).fill("15");
  // A start date safely before this month's day 15 guarantees this month's occurrence
  // exists regardless of which day "today" actually is when the suite runs (defaulting
  // to today would often push the start past the 15th and skip this month entirely).
  await dialog.getByLabel("Début", { exact: true }).fill("2026-01-01");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Assurance test", { exact: false }).first(),
  ).toBeVisible();
  // Reopening confirms "bill" was actually saved, not just held in form state.
  await page
    .getByRole("button", { name: "Modifier Assurance test", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Nature", { exact: true })).toHaveValue(
    "bill",
  );
  await dialog.getByRole("button", { name: "Fermer" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // 2bis) Statuts explicites : "Marquer payé" ouvre l'éditeur avec la date de règlement
  // visible et modifiable (pas d'écriture silencieuse), "Remettre à payer" revient en
  // arrière sans effacer la trace du règlement précédent. Exercised from Mon mois' own
  // transactions list (the "flux réalisé" side), independent of the Abonnements page.
  await nav.getByRole("button", { name: "Mon mois", exact: true }).click();
  const occurrenceRow = page
    .locator(".row", { hasText: "Assurance test" })
    .filter({ hasNotText: "tous les" });
  await expect(occurrenceRow).toContainText("Pas encore payé");
  await occurrenceRow
    .getByRole("button", { name: "Marquer payé", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Libellé", { exact: true })).toHaveValue(
    "Assurance test",
  );
  await expect(dialog.getByLabel("État", { exact: true })).toHaveValue(
    "settled",
  );
  await expect(
    dialog.getByLabel("Date de l’opération ou échéance", { exact: true }),
  ).not.toHaveValue("");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(occurrenceRow).toContainText("Payé");
  await expect(occurrenceRow).not.toContainText("Pas encore payé");
  page.once("dialog", (d) => d.accept());
  await occurrenceRow
    .getByRole("button", { name: "Remettre à payer Assurance test", exact: true })
    .click();
  await expect(occurrenceRow).toContainText("Pas encore payé");
  // Regression: the occurrence is now a persisted transaction (status "planned"), not a
  // virtual one anymore. Clicking "Marquer payé" a second time must still open the editor
  // pre-filled to settled/today — spec.transaction must win over the stale persisted
  // record, not the other way around (see EditorSpec.transaction in Editor.tsx).
  await occurrenceRow
    .getByRole("button", { name: "Marquer payé", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("État", { exact: true })).toHaveValue("settled");
  await expect(
    dialog.getByLabel("Date de l’opération ou échéance", { exact: true }),
  ).not.toHaveValue("");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(occurrenceRow).toContainText("Payé");
  await expect(occurrenceRow).not.toContainText("Pas encore payé");

  // 2ter) Même régression pour une opération ponctuelle déjà persistée dès sa création
  // (pas liée à une récurrence) : "Marquer payé" doit aussi la préremplir correctement.
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Libellé").fill("Café test");
  await dialog.getByLabel("Montant", { exact: true }).fill("6");
  await dialog
    .getByLabel("Compte", { exact: true })
    .selectOption({ label: "Compte principal test · CHF" });
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const oneOffRow = page.locator(".row", { hasText: "Café test" });
  await expect(oneOffRow).toContainText("Pas encore payé");
  await oneOffRow
    .getByRole("button", { name: "Marquer payé", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("État", { exact: true })).toHaveValue("settled");
  await expect(
    dialog.getByLabel("Date de l’opération ou échéance", { exact: true }),
  ).not.toHaveValue("");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(oneOffRow).toContainText("Payé");
  await expect(oneOffRow).not.toContainText("Pas encore payé");

  // 3) Transfer between two accounts of different currencies: source account is required,
  // currency is deduced from it, and the destination amount is required across currencies.
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Libellé").fill("Virement voyage test");
  await dialog.locator('select[name="kind"]').selectOption("transfer");
  await dialog.getByLabel("Montant", { exact: true }).fill("200");
  await dialog
    .getByLabel("Compte", { exact: true })
    .selectOption({ label: "Compte principal test · CHF" });
  await expect(dialog.getByLabel("Devise", { exact: true })).toHaveValue(
    "CHF",
  );
  await dialog
    .getByLabel("Compte destinataire", { exact: true })
    .selectOption({ label: "Compte voyage test · EUR" });
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  // Cross-currency transfer without a received amount stays open with the input kept.
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByRole("alert")).toContainText(
    "montant reçu requis pour un virement entre devises",
  );
  await expect(dialog.getByLabel("Libellé")).toHaveValue(
    "Virement voyage test",
  );
  await dialog
    .getByLabel("Montant reçu (devise du destinataire)", { exact: true })
    .fill("208");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Virement voyage test", { exact: true }),
  ).toBeVisible();
  // A transfer is neither income nor expense.
  await page.getByRole("button", { name: "Revenus", exact: true }).click();
  await expect(
    page.getByText("Virement voyage test", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Virements", exact: true }).click();
  await expect(
    page.getByText("Virement voyage test", { exact: true }),
  ).toBeVisible();

  // 4) Investment position: only investment-kind accounts are offered.
  await nav
    .getByRole("button", { name: "Investissements", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  dialog = page.getByRole("dialog");
  const accountOptions = await dialog
    .getByLabel("Compte d’investissement", { exact: true })
    .locator("option")
    .allTextContents();
  expect(accountOptions).toEqual(["Non renseigné", "Portefeuille test · CHF"]);
  await dialog.getByLabel("Nom du titre", { exact: true }).fill("ETF test");
  await dialog
    .getByLabel("Compte d’investissement", { exact: true })
    .selectOption({ label: "Portefeuille test · CHF" });
  await dialog.getByLabel("Valeur totale de la position").fill("1000");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator(".row-title", { hasText: "ETF test" }),
  ).toBeVisible();

  expect(errors).toEqual([]);
});
test("restore an older backup: refused with an explicit confirmation, cancel changes nothing, confirming restores it", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const restorePassphrase = "Exemple-test-Finance-restore-2026";
  const nav = page.getByRole("navigation", {
    name: "Navigation principale",
    exact: true,
  });
  async function addAccount(name: string) {
    await nav.getByRole("button", { name: "Mes comptes", exact: true }).click();
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nom du compte").fill(name);
    await dialog.getByLabel("Établissement").fill("Banque Fictive");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }

  await page.goto("/");
  await page.getByLabel("Phrase secrète", { exact: true }).fill(restorePassphrase);
  await page.getByLabel("Confirmer la phrase secrète").fill(restorePassphrase);
  await page.getByRole("button", { name: "Créer mon coffre" }).click();

  // Baseline account, then an encrypted backup that dates this exact state ("old").
  await addAccount("Compte ancien fictif");
  await nav
    .getByRole("button", { name: "Documents et réglages", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Sauvegarde chiffrée", exact: true })
    .click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error("Téléchargement de sauvegarde introuvable.");
  const oldBackup = await readFile(downloadPath);

  // A later change moves the on-device vault's savedAt strictly after the backup above.
  await addAccount("Compte récent fictif");
  await page
    .getByRole("button", { name: "Verrouiller l’espace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ouvrir mon espace" }),
  ).toBeVisible();

  async function selectOldBackupAndSubmit() {
    await page.getByLabel("Restaurer une sauvegarde").setInputFiles({
      name: "ancienne-sauvegarde.finance-vault",
      mimeType: "application/octet-stream",
      buffer: oldBackup,
    });
    await expect(
      page.getByRole("heading", { name: "Restaurer votre sauvegarde" }),
    ).toBeVisible();
    await page
      .getByLabel("Phrase secrète", { exact: true })
      .fill(restorePassphrase);
    await page
      .getByLabel("Remplacer le coffre de cet appareil par cette sauvegarde.")
      .check();
    await page.getByRole("button", { name: "Restaurer", exact: true }).click();
  }

  // 1) Refused: the backup is older than the vault already on this device.
  await selectOldBackupAndSubmit();
  const confirmHeading = page.getByRole("heading", {
    name: "Confirmer la restauration",
  });
  await expect(confirmHeading).toBeVisible();
  await expect(page.locator("#older-backup-message")).toContainText(
    "plus ancienne",
  );
  await expect(page.getByRole("alertdialog")).toBeVisible();
  // The safer action (Annuler) is the one that receives focus by default.
  await expect(
    page.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();

  // 2) Cancel: no false success, and — proven by unlocking normally right after — the
  // on-device vault was genuinely never touched by the refused attempt.
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(confirmHeading).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Restaurer votre sauvegarde" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Annuler la restauration", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ouvrir mon espace" }),
  ).toBeVisible();
  await page
    .getByLabel("Phrase secrète", { exact: true })
    .fill(restorePassphrase);
  await page.getByRole("button", { name: "Déverrouiller", exact: true }).click();
  await nav.getByRole("button", { name: "Mes comptes", exact: true }).click();
  await expect(page.getByText("Compte récent fictif", { exact: true })).toBeVisible();
  await expect(page.getByText("Compte ancien fictif", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Verrouiller l’espace", exact: true })
    .click();

  // 3) Confirm explicitly this time: the older backup is restored, replacing the newer vault.
  await selectOldBackupAndSubmit();
  await expect(confirmHeading).toBeVisible();
  await page
    .getByRole("button", { name: "Restaurer quand même", exact: true })
    .click();
  await expect(confirmHeading).toHaveCount(0);
  await expect(page.getByText("Compte ancien fictif", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Compte récent fictif", { exact: true }),
  ).toHaveCount(0);

  expect(errors).toEqual([]);
});

test("month picker: French Janvier–Décembre row, year navigation, Ce mois-ci shortcut", async ({
  page,
}) => {
  const monthPassphrase = "Exemple-test-Finance-mois-2026";
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthName = monthNames[now.getMonth()];
  // 6 months away is always a different month regardless of when the suite runs.
  const otherMonthName = monthNames[(now.getMonth() + 6) % 12];

  await page.goto("/");
  await page.getByLabel("Phrase secrète", { exact: true }).fill(monthPassphrase);
  await page.getByLabel("Confirmer la phrase secrète").fill(monthPassphrase);
  await page.getByRole("button", { name: "Créer mon coffre" }).click();

  const currentChip = page.getByRole("button", { name: currentMonthName, exact: true });
  await expect(currentChip).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(String(currentYear), { exact: true })).toBeVisible();
  // The current month is selected by default: no "back to this month" shortcut needed yet.
  await expect(page.getByRole("button", { name: "Ce mois-ci" })).toHaveCount(0);
  // A plain <div> with just aria-label has no accessible name (generic role strips it) —
  // role="group" is what actually exposes "Choisir un mois" to assistive tech.
  await expect(
    page.getByRole("group", { name: "Choisir un mois", exact: true }),
  ).toBeVisible();

  // Distinct, disambiguated short labels: a naive slice(0, 3) would show "Jui" for both.
  await expect(
    page.getByRole("button", { name: "Juin", exact: true }),
  ).toHaveText("Jun");
  await expect(
    page.getByRole("button", { name: "Juillet", exact: true }),
  ).toHaveText("Jul");

  // Selecting another month updates the pressed chip and reveals the "back to today" shortcut.
  await page.getByRole("button", { name: otherMonthName, exact: true }).click();
  await expect(currentChip).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: otherMonthName, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const backToToday = page.getByRole("button", { name: "Ce mois-ci" });
  await expect(backToToday).toBeVisible();

  // Year navigation keeps the same month number and stays reachable from any month.
  await page.getByRole("button", { name: "Année suivante" }).click();
  await expect(page.getByText(String(currentYear + 1), { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: otherMonthName, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Année précédente" }).click();
  await expect(page.getByText(String(currentYear), { exact: true })).toBeVisible();

  // The shortcut returns exactly to today's month and then disappears.
  await backToToday.click();
  await expect(currentChip).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Ce mois-ci" })).toHaveCount(0);
});

// abonnements.md, "Vérifications obligatoires": "Le parcours navigateur doit vérifier qu'un
// statut changé sur Abonnements met à jour Mon mois et l'Accueil après rechargement et
// déverrouillage, sans doublon." — exercised here specifically from the Abonnements page's own
// "Marquer payé" action, distinct from the equivalent action already covered on Mon mois by the
// "daily entries" test above.
test("subscriptions: a status change made on Abonnements updates Mon mois and Accueil, no duplicate, survives reload", async ({
  page,
}) => {
  const subsPassphrase = "Exemple-test-Finance-abonnements-2026";
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Phrase secrète", { exact: true }).fill(subsPassphrase);
  await page.getByLabel("Confirmer la phrase secrète").fill(subsPassphrase);
  await page.getByRole("button", { name: "Créer mon coffre" }).click();
  const nav = page.getByRole("navigation", {
    name: "Navigation principale",
    exact: true,
  });

  await nav.getByRole("button", { name: "Mes comptes", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nom du compte").fill("Compte abonnements test");
  await dialog.getByLabel("Établissement").fill("Banque Fictive");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Day 1, monthly, started well in the past: due every month regardless of run date.
  await nav.getByRole("button", { name: "Abonnements", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Libellé", { exact: true }).fill("Charge test abo");
  await dialog.getByLabel("Nature", { exact: true }).selectOption("bill");
  await dialog.getByLabel("Montant", { exact: true }).fill("77.70");
  await dialog
    .getByLabel("Compte", { exact: true })
    .selectOption({ label: "Compte abonnements test · CHF" });
  await dialog.getByLabel("Catégorie", { exact: true }).fill("Test");
  await dialog.getByLabel("Jour du mois", { exact: true }).fill("1");
  await dialog.getByLabel("Début", { exact: true }).fill("2020-01-01");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // A single row per recurrence on Abonnements: cadence and status share it, unlike Mon mois'
  // separate "opérations" and "aperçu" rows, so no "tous les" filter is needed here.
  const subsRow = page.locator(".row", { hasText: "Charge test abo" });
  await expect(subsRow).toContainText("Pas encore payé");
  const resteDu = page
    .locator(".stat-card", { hasText: "Reste dû" })
    .locator(".metric-value");
  await expect(resteDu).toContainText("77.70");

  // Mark it paid from Abonnements itself, not from Mon mois.
  await subsRow
    .getByRole("button", { name: "Marquer payé", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("État", { exact: true })).toHaveValue(
    "settled",
  );
  await expect(
    dialog.getByLabel("Date de l’opération ou échéance", { exact: true }),
  ).not.toHaveValue("");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(subsRow).toContainText("Payé");
  await expect(subsRow).not.toContainText("Pas encore payé");
  await expect(resteDu).toContainText("0.00");

  // Mon mois: exactly one row for the occurrence itself (excluding the separate recurrence
  // preview row, which also mentions "tous les") — no duplicate transaction was created.
  await nav.getByRole("button", { name: "Mon mois", exact: true }).click();
  const monthOccurrenceRow = page
    .locator(".row", { hasText: "Charge test abo" })
    .filter({ hasNotText: "tous les" });
  await expect(monthOccurrenceRow).toHaveCount(1);
  await expect(monthOccurrenceRow).toContainText("Payé");

  // Accueil: the settlement is reflected in the month's confirmed figures.
  await nav.getByRole("button", { name: "Vue d’ensemble", exact: true }).click();
  const expensesConfirmed = page
    .locator(".metric", { hasText: "Dépenses confirmées" })
    .locator(".metric-value");
  await expect(expensesConfirmed).toContainText("77.70");

  // Reload and unlock: everything above survives, still no duplicate.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ouvrir mon espace" }),
  ).toBeVisible();
  await page.getByLabel("Phrase secrète", { exact: true }).fill(subsPassphrase);
  await page
    .getByRole("button", { name: "Déverrouiller", exact: true })
    .click();
  // Overview's own <h1> reads "Une vue sur l'essentiel.", not "Vue d'ensemble" (see App.tsx's
  // page-title ternary) — lands there by default since `page` state resets to "overview" on
  // every fresh mount, unlock included.
  await expect(
    page.getByRole("heading", { name: "Une vue sur l’essentiel.", exact: true }),
  ).toBeVisible();
  await expect(expensesConfirmed).toContainText("77.70");
  await nav.getByRole("button", { name: "Mon mois", exact: true }).click();
  await expect(monthOccurrenceRow).toHaveCount(1);
  await expect(monthOccurrenceRow).toContainText("Payé");
  await nav.getByRole("button", { name: "Abonnements", exact: true }).click();
  await expect(subsRow).toContainText("Payé");
  await expect(resteDu).toContainText("0.00");

  expect(errors).toEqual([]);
});
