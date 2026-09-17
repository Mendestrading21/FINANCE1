import type { FinanceData } from "./domain/types";
import { validateData } from "./domain/validation";

/** Only this encrypted envelope is persisted. Keys and clear text stay in memory. */
const STORAGE_KEY = "finance.vault.v1";
const ITERATIONS = 600_000;
const MAX_ITERATIONS = 1_000_000;
const MAX_FILE_BYTES = 25_000_000;
const MAX_PLAINTEXT_BYTES = Math.floor(((MAX_FILE_BYTES - 1_024) * 3) / 4) - 16;
const OPEN_ERROR =
  "Impossible d’ouvrir le coffre. Vérifiez la phrase secrète et la sauvegarde.";
const INVALID_ERROR = "Sauvegarde Finance invalide ou incompatible.";
const CONFLICT_ERROR =
  "Le coffre a changé dans un autre onglet. Verrouillez puis ouvrez-le à nouveau avant d’enregistrer.";
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

type Envelope = {
  format: "Finance";
  version: 1;
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt: string };
  cipher: { name: "AES-GCM"; iv: string; tagLength: 128 };
  ciphertext: string;
};
type KeyState = { salt: string; iterations: number; expectedRaw: string };
const keyStates = new WeakMap<CryptoKey, KeyState>();

function webCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "Le coffre exige un navigateur récent dans un contexte sécurisé (HTTPS ou localhost).",
    );
  }
  return globalThis.crypto;
}

function storage(): Storage {
  try {
    return globalThis.localStorage;
  } catch {
    throw new Error(
      "Le stockage de cet appareil est inaccessible. Vérifiez les réglages du navigateur.",
    );
  }
}

function readRaw(): string | null {
  try {
    const local = storage();
    if (!local) throw new Error("unavailable");
    return local.getItem(STORAGE_KEY);
  } catch {
    throw new Error(
      "Le stockage de cet appareil est inaccessible. Vérifiez les réglages du navigateur.",
    );
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function toBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
  }
  return btoa(chunks.join(""));
}

function fromBase64(
  value: unknown,
  minBytes: number,
  maxBytes: number,
): Uint8Array<ArrayBuffer> {
  if (
    typeof value !== "string" ||
    value.length % 4 !== 0 ||
    value.length > 4 * Math.ceil(maxBytes / 3) ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(value)
  ) {
    throw new Error(INVALID_ERROR);
  }
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new Error(INVALID_ERROR);
  }
  if (
    binary.length < minBytes ||
    binary.length > maxBytes ||
    btoa(binary) !== value
  ) {
    throw new Error(INVALID_ERROR);
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function parseEnvelope(raw: string): Envelope {
  if (
    typeof raw !== "string" ||
    raw.length > MAX_FILE_BYTES ||
    encoder.encode(raw).byteLength > MAX_FILE_BYTES
  ) {
    throw new Error("Sauvegarde trop volumineuse (25 Mo maximum).");
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(INVALID_ERROR);
  }
  if (
    !record(value) ||
    !exactKeys(value, ["format", "version", "kdf", "cipher", "ciphertext"]) ||
    value.format !== "Finance" ||
    value.version !== 1 ||
    !record(value.kdf) ||
    !record(value.cipher) ||
    !exactKeys(value.kdf, ["name", "hash", "iterations", "salt"]) ||
    !exactKeys(value.cipher, ["name", "iv", "tagLength"]) ||
    value.kdf.name !== "PBKDF2" ||
    value.kdf.hash !== "SHA-256" ||
    !Number.isSafeInteger(value.kdf.iterations) ||
    typeof value.kdf.iterations !== "number" ||
    value.kdf.iterations < ITERATIONS ||
    value.kdf.iterations > MAX_ITERATIONS ||
    value.cipher.name !== "AES-GCM" ||
    value.cipher.tagLength !== 128
  ) {
    throw new Error(INVALID_ERROR);
  }
  fromBase64(value.kdf.salt, 16, 16);
  fromBase64(value.cipher.iv, 12, 12);
  fromBase64(value.ciphertext, 17, MAX_PLAINTEXT_BYTES + 16);
  return value as Envelope;
}

/** Stable, authenticated metadata: property order in an imported JSON file is irrelevant. */
function additionalData(
  envelope: Omit<Envelope, "ciphertext">,
): Uint8Array<ArrayBuffer> {
  return encoder.encode(
    JSON.stringify([
      envelope.format,
      envelope.version,
      envelope.kdf.name,
      envelope.kdf.hash,
      envelope.kdf.iterations,
      envelope.kdf.salt,
      envelope.cipher.name,
      envelope.cipher.iv,
      envelope.cipher.tagLength,
    ]),
  );
}

async function deriveKey(
  passphrase: string,
  salt: string,
  iterations: number,
): Promise<CryptoKey> {
  if (
    typeof passphrase !== "string" ||
    !passphrase.length ||
    passphrase.length > 1_024
  ) {
    throw new Error(OPEN_ERROR);
  }
  const crypto = webCrypto();
  const passwordBytes = encoder.encode(passphrase);
  let material: CryptoKey;
  try {
    material = await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      "PBKDF2",
      false,
      ["deriveKey"],
    );
  } finally {
    passwordBytes.fill(0);
  }
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromBase64(salt, 16, 16),
      iterations,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function seal(
  key: CryptoKey,
  state: Pick<KeyState, "salt" | "iterations">,
  data: FinanceData,
): Promise<string> {
  const validated = validateData(data);
  const plaintext = encoder.encode(JSON.stringify(validated));
  if (plaintext.byteLength > MAX_PLAINTEXT_BYTES) {
    plaintext.fill(0);
    throw new Error(
      "Le coffre est trop volumineux. Réduisez les pièces jointes avant d’enregistrer.",
    );
  }
  const crypto = webCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const metadata: Omit<Envelope, "ciphertext"> = {
    format: "Finance",
    version: 1,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: state.iterations,
      salt: state.salt,
    },
    cipher: { name: "AES-GCM", iv: toBase64(iv), tagLength: 128 },
  };
  try {
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        tagLength: 128,
        additionalData: additionalData(metadata),
      },
      key,
      plaintext,
    );
    return JSON.stringify({
      ...metadata,
      ciphertext: toBase64(new Uint8Array(ciphertext)),
    } satisfies Envelope);
  } finally {
    plaintext.fill(0);
  }
}

async function open(
  envelope: Envelope,
  passphrase: string,
): Promise<{ key: CryptoKey; data: FinanceData }> {
  // Failure of the passphrase, authentication tag, UTF-8 or data schema shares one message.
  try {
    const key = await deriveKey(
      passphrase,
      envelope.kdf.salt,
      envelope.kdf.iterations,
    );
    const plaintext = new Uint8Array(
      await webCrypto().subtle.decrypt(
        {
          name: "AES-GCM",
          iv: fromBase64(envelope.cipher.iv, 12, 12),
          tagLength: 128,
          additionalData: additionalData(envelope),
        },
        key,
        fromBase64(envelope.ciphertext, 17, MAX_PLAINTEXT_BYTES + 16),
      ),
    );
    try {
      const data = validateData(JSON.parse(decoder.decode(plaintext)));
      return { key, data };
    } finally {
      plaintext.fill(0);
    }
  } catch {
    throw new Error(OPEN_ERROR);
  }
}

async function commit(raw: string, expected: string | null): Promise<void> {
  const write = () => {
    if (readRaw() !== expected) throw new Error(CONFLICT_ERROR);
    try {
      // Web Storage setItem is atomic: on quota/security failure the previous value is retained.
      // Never remove the previous vault or write an unencrypted temporary copy.
      storage().setItem(STORAGE_KEY, raw);
    } catch {
      throw new Error(
        "Enregistrement impossible : espace disponible ou stockage inaccessible. Votre coffre précédent est conservé.",
      );
    }
  };
  // A shared exclusive lock makes the check-and-write indivisible across cooperating tabs.
  // Older browsers still get optimistic conflict detection; the limitation is documented.
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    let failure: unknown;
    await navigator.locks.request(
      "finance.vault.write",
      { mode: "exclusive" },
      () => {
        try {
          write();
        } catch (error) {
          failure = error;
        }
      },
    );
    // Propagate after releasing the lock, including runtimes that mishandle a thrown callback.
    if (failure !== undefined) throw failure;
  } else {
    write();
  }
}

export function vaultExists(): boolean {
  // Fail closed: inaccessible storage must never appear to be an empty vault.
  try {
    return readRaw() !== null;
  } catch {
    return true;
  }
}

export async function createVault(
  passphrase: string,
  data: FinanceData,
): Promise<CryptoKey> {
  if (
    typeof passphrase !== "string" ||
    Array.from(passphrase).length < 12 ||
    passphrase.length > 1_024
  ) {
    throw new Error(
      "Choisissez une phrase secrète de 12 caractères minimum (1 024 maximum).",
    );
  }
  if (readRaw() !== null)
    throw new Error(
      "Un coffre existe déjà sur cet appareil. Ouvrez-le ou restaurez une sauvegarde.",
    );
  const validated = validateData(data);
  const salt = toBase64(webCrypto().getRandomValues(new Uint8Array(16)));
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const raw = await seal(key, { salt, iterations: ITERATIONS }, validated);
  await commit(raw, null);
  keyStates.set(key, { salt, iterations: ITERATIONS, expectedRaw: raw });
  return key;
}

export async function unlockVault(
  passphrase: string,
): Promise<{ key: CryptoKey; data: FinanceData }> {
  const raw = readRaw();
  if (raw === null)
    throw new Error("Aucun coffre enregistré sur cet appareil.");
  const envelope = parseEnvelope(raw);
  const result = await open(envelope, passphrase);
  if (readRaw() !== raw) throw new Error(CONFLICT_ERROR);
  keyStates.set(result.key, {
    salt: envelope.kdf.salt,
    iterations: envelope.kdf.iterations,
    expectedRaw: raw,
  });
  return result;
}

export async function saveVault(
  key: CryptoKey,
  data: FinanceData,
): Promise<void> {
  const state = keyStates.get(key);
  if (!state)
    throw new Error("Coffre verrouillé. Ouvrez-le avant d’enregistrer.");
  // Capture before encryption so concurrent saves from the same session cannot overwrite each other.
  const expectedRaw = state.expectedRaw;
  if (readRaw() !== expectedRaw) throw new Error(CONFLICT_ERROR);
  const raw = await seal(key, state, data);
  await commit(raw, expectedRaw);
  state.expectedRaw = raw;
}

export function exportVault(): string {
  const raw = readRaw();
  if (raw === null) throw new Error("Aucun coffre à sauvegarder.");
  parseEnvelope(raw);
  return raw;
}

export async function importVault(
  raw: string,
  passphrase: string,
): Promise<{ key: CryptoKey; data: FinanceData }> {
  const previous = readRaw();
  const envelope = parseEnvelope(raw);
  const result = await open(envelope, passphrase);
  // Validate and decrypt completely before any write. An invalid import leaves the old vault intact.
  const normalized = JSON.stringify(envelope);
  await commit(normalized, previous);
  keyStates.set(result.key, {
    salt: envelope.kdf.salt,
    iterations: envelope.kdf.iterations,
    expectedRaw: normalized,
  });
  return result;
}
