import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyData, type FinanceData } from "./domain/types";
import {
  createVault,
  exportVault,
  importVault,
  saveVault,
  unlockVault,
  vaultExists,
} from "./vault";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  failWrites = false;
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.failWrites)
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    this.values.set(key, String(value));
  }
}

const PASSPHRASE = "Coffre test très privé 2026";
let local: MemoryStorage;
const sample = (): FinanceData => ({
  ...emptyData(),
  accounts: [
    {
      id: "bank-test",
      name: "Compte confidentiel",
      institution: "Établissement fictif",
      kind: "bank",
      currency: "CHF",
      valuationMode: "total",
      source: { system: "manual" },
      balances: [
        {
          id: "balance-test",
          amountMinor: 125_050,
          asOf: "2026-09-17",
          source: { system: "manual" },
        },
      ],
    },
  ],
});

beforeEach(() => {
  local = new MemoryStorage();
  vi.stubGlobal("localStorage", local);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("coffre privé avec le vrai Web Crypto", () => {
  it("chiffre, ouvre, enregistre et restaure les données sans clé ou mot de passe persisté", async () => {
    expect(vaultExists()).toBe(false);
    const key = await createVault(PASSPHRASE, sample());
    expect(key.extractable).toBe(false);
    expect(key.algorithm).toEqual({ name: "AES-GCM", length: 256 });
    expect(vaultExists()).toBe(true);
    const initial = exportVault();
    expect(local.length).toBe(1);
    expect(initial).not.toContain("Compte confidentiel");
    expect(initial).not.toContain("amountMinor");
    expect(initial).not.toContain(PASSPHRASE);
    const envelope = JSON.parse(initial);
    expect(envelope.kdf.iterations).toBe(600_000);
    expect(atob(envelope.kdf.salt).length).toBe(16);
    expect(atob(envelope.cipher.iv).length).toBe(12);
    const opened = await unlockVault(PASSPHRASE);
    expect(opened.data).toEqual(sample());
    expect(opened.key.extractable).toBe(false);
    const updated = {
      ...sample(),
      preferences: { baseCurrency: "EUR", locale: "fr-CH" },
    };
    await saveVault(opened.key, updated);
    const saved = exportVault();
    expect(JSON.parse(saved).cipher.iv).not.toBe(envelope.cipher.iv);
    expect((await unlockVault(PASSPHRASE)).data).toEqual(updated);
    local.clear();
    const restored = await importVault(saved, PASSPHRASE);
    expect(restored.data).toEqual(updated);
    await saveVault(restored.key, sample());
    expect((await unlockVault(PASSPHRASE)).data).toEqual(sample());
  });

  it("refuse une phrase courte et empêche une création de remplacer un coffre existant", async () => {
    await expect(createVault("trop court", sample())).rejects.toThrow(
      "12 caractères",
    );
    expect(local.length).toBe(0);
    await createVault(PASSPHRASE, sample());
    const before = exportVault();
    await expect(createVault(PASSPHRASE, emptyData())).rejects.toThrow(
      "existe déjà",
    );
    expect(exportVault()).toBe(before);
  });

  it("renvoie la même erreur pour une phrase incorrecte et un chiffré altéré, sans remplacement", async () => {
    await createVault(PASSPHRASE, sample());
    const before = exportVault();
    const wrong = await unlockVault("Une mauvaise phrase secrète").catch(
      (error) => error as Error,
    );
    expect(wrong).toBeInstanceOf(Error);
    const altered = JSON.parse(before);
    const binary = atob(altered.ciphertext);
    altered.ciphertext = btoa(
      String.fromCharCode(binary.charCodeAt(0) ^ 1) + binary.slice(1),
    );
    const tampered = await importVault(
      JSON.stringify(altered),
      PASSPHRASE,
    ).catch((error) => error as Error);
    expect(tampered).toBeInstanceOf(Error);
    expect((tampered as Error).message).toBe((wrong as Error).message);
    expect(exportVault()).toBe(before);
  });

  it("conserve le coffre précédent quand le stockage est plein et permet une nouvelle tentative", async () => {
    const key = await createVault(PASSPHRASE, sample());
    const before = exportVault();
    local.failWrites = true;
    await expect(saveVault(key, emptyData())).rejects.toThrow(
      "précédent est conservé",
    );
    expect(exportVault()).toBe(before);
    await expect(importVault(before, PASSPHRASE)).rejects.toThrow(
      "précédent est conservé",
    );
    expect(exportVault()).toBe(before);
    local.failWrites = false;
    await saveVault(key, emptyData());
    expect((await unlockVault(PASSPHRASE)).data).toEqual(emptyData());
  });

  it("refuse JSON malformé, clés supplémentaires, paramètres non bornés et base64 invalide avant dérivation", async () => {
    await createVault(PASSPHRASE, sample());
    const before = exportVault();
    const envelope = JSON.parse(before);
    const derive = vi.spyOn(crypto.subtle, "deriveKey");
    const invalid = [
      "{",
      "null",
      JSON.stringify(emptyData()),
      JSON.stringify({ ...envelope, additional: true }),
      JSON.stringify({ ...envelope, version: 2 }),
      JSON.stringify({ ...envelope, kdf: { ...envelope.kdf, iterations: 1 } }),
      JSON.stringify({
        ...envelope,
        kdf: { ...envelope.kdf, iterations: 1_000_001 },
      }),
      JSON.stringify({ ...envelope, kdf: { ...envelope.kdf, salt: "AAAA" } }),
      JSON.stringify({
        ...envelope,
        cipher: { ...envelope.cipher, iv: "!!!!!!!!!!!!====" },
      }),
      JSON.stringify({ ...envelope, ciphertext: "%%%%" }),
    ];
    for (const raw of invalid) {
      await expect(importVault(raw, PASSPHRASE)).rejects.toThrow(
        "invalide ou incompatible",
      );
      expect(exportVault()).toBe(before);
    }
    expect(derive).not.toHaveBeenCalled();
  });

  it("rejette une sauvegarde dépassant 25 Mo avant analyse et ne modifie rien", async () => {
    await createVault(PASSPHRASE, sample());
    const before = exportVault();
    await expect(
      importVault(" ".repeat(25_000_001), PASSPHRASE),
    ).rejects.toThrow("25 Mo");
    expect(exportVault()).toBe(before);
  });

  it("valide les données avant enregistrement et garde le coffre précédent", async () => {
    const key = await createVault(PASSPHRASE, sample());
    const before = exportVault();
    await expect(
      saveVault(key, { ...sample(), version: 99 } as unknown as FinanceData),
    ).rejects.toThrow();
    expect(exportVault()).toBe(before);
  });

  it("refuse une ancienne session après une sauvegarde depuis une autre session", async () => {
    const oldKey = await createVault(PASSPHRASE, sample());
    const newSession = await unlockVault(PASSPHRASE);
    await saveVault(newSession.key, emptyData());
    const before = exportVault();
    await expect(saveVault(oldKey, sample())).rejects.toThrow("autre onglet");
    expect(exportVault()).toBe(before);
  });

  it("refuse un écrasement silencieux lorsque deux sauvegardes sont lancées en même temps", async () => {
    const key = await createVault(PASSPHRASE, sample());
    const other = {
      ...emptyData(),
      preferences: { baseCurrency: "USD", locale: "fr-CH" },
    };
    const results = await Promise.allSettled([
      saveVault(key, emptyData()),
      saveVault(key, other),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    const failure = results.find(
      (result) => result.status === "rejected",
    ) as PromiseRejectedResult;
    expect(failure.reason.message).toContain("autre onglet");
    const restored = (await unlockVault(PASSPHRASE)).data;
    expect([emptyData(), other]).toContainEqual(restored);
  });

  it("ne confond pas le stockage inaccessible avec l’absence de coffre", async () => {
    vi.spyOn(local, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    expect(vaultExists()).toBe(true);
    await expect(createVault(PASSPHRASE, sample())).rejects.toThrow(
      "inaccessible",
    );
    expect(local.length).toBe(0);
  });
});
