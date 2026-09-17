import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  emptyData,
  type FinanceData,
  type Account,
  type Source,
  type Transaction,
} from "./domain/types";
import {
  availableSummary,
  latestBalance,
  money,
  monthLabel,
  monthSummary,
  today,
  transactionsForMonth,
  wealthSummary,
} from "./domain/finance";
import { validateData, mergeImport } from "./domain/validation";
import {
  createVault,
  unlockVault,
  saveVault,
  vaultExists,
  exportVault,
  importVault,
} from "./vault";
import { demoData } from "./demo";
import { parseTransactionCsv, CSV_TEMPLATE } from "./importCsv";
import { Icon } from "./components/Icon";
import { Allocation, FlowChart, WealthChart } from "./components/Charts";
import Editor, { type EditorSpec } from "./components/Editor";
const pages = [
  { id: "overview", name: "Vue d’ensemble", short: "Accueil", icon: "home" },
  { id: "month", name: "Mon mois", short: "Mon mois", icon: "calendar" },
  { id: "accounts", name: "Mes comptes", short: "Comptes", icon: "wallet" },
  { id: "goals", name: "Épargne et projets", short: "Projets", icon: "target" },
  {
    id: "investments",
    name: "Investissements",
    short: "Investir",
    icon: "chart",
  },
  {
    id: "documents",
    name: "Documents et réglages",
    short: "Documents",
    icon: "folder",
  },
] as const;
type Page = (typeof pages)[number]["id"];
function download(raw: string, name: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([raw], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function SourceLink({ source }: { source: Source }) {
  return source.url && /^https:\/\/(www\.)?notion\.so\//.test(source.url) ? (
    <a
      className="source-link"
      href={source.url}
      target="_blank"
      rel="noreferrer"
      title={source.note}
    >
      {source.note?.includes("Modification manuelle")
        ? "Notion · modifié manuellement ↗"
        : "Source Notion ↗"}
    </a>
  ) : (
    <span className="meta">
      {source.system === "demo"
        ? "Exemple fictif"
        : source.system === "manual"
          ? "Saisie manuelle"
          : source.system === "notion"
            ? "Source Notion"
            : "Import"}
    </span>
  );
}
function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
// vault.ts (importVault) refuses a backup strictly older than the vault already present
// on this device by throwing a plain Error whose message starts with this exact wording.
// It exposes no dedicated error type, so the UI matches on that stable prefix to offer an
// explicit "restore anyway" confirmation instead of a dead-end error. Keep in sync with the
// message importVault throws in src/vault.ts.
const OLDER_BACKUP_ERROR_PREFIX = "Cette sauvegarde est plus ancienne";
function isOlderBackupError(message: string): boolean {
  return message.startsWith(OLDER_BACKUP_ERROR_PREFIX);
}
function Auth({
  onOpen,
  onDemo,
}: {
  onOpen: (data: FinanceData, key: CryptoKey) => void;
  onDemo: () => void;
}) {
  const [exists, setExists] = useState(vaultExists),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [backup, setBackup] = useState<string | null>(null),
    // Set only when importVault refused to restore because the backup is older than the
    // current vault. Holds what's needed to retry with allowOlder once the person
    // explicitly confirms; cleared on cancel, on success, or if another error occurs.
    [olderBackup, setOlderBackup] = useState<{
      raw: string;
      password: string;
      message: string;
    } | null>(null),
    cancelOlderBackupRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Default focus lands on the safer action so a stray Enter/Space never replaces
    // newer data by accident.
    if (olderBackup) cancelOlderBackupRef.current?.focus();
  }, [olderBackup]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    let password = "";
    try {
      const f = new FormData(e.currentTarget);
      password = String(f.get("password") || "");
      if (backup) {
        if (exists && !f.get("replace"))
          throw new Error(
            "Confirmez le remplacement du coffre présent sur cet appareil.",
          );
        const r = await importVault(backup, password);
        onOpen(r.data, r.key);
      } else if (exists) {
        const r = await unlockVault(password);
        onOpen(r.data, r.key);
      } else {
        if (password !== f.get("confirmation"))
          throw new Error("Les deux phrases secrètes sont différentes.");
        const data = emptyData();
        const key = await createVault(password, data);
        onOpen(data, key);
      }
    } catch (e) {
      if (backup && e instanceof Error && isOlderBackupError(e.message)) {
        // Nothing was written (importVault fails closed before touching the vault):
        // ask for an explicit, conscious confirmation instead of a dead-end error.
        setOlderBackup({ raw: backup, password, message: e.message });
      } else {
        setError(
          e instanceof Error ? e.message : "Impossible d’ouvrir le coffre.",
        );
      }
    } finally {
      setBusy(false);
    }
  }
  async function confirmOlderBackup() {
    if (!olderBackup) return;
    setBusy(true);
    setError("");
    try {
      const r = await importVault(olderBackup.raw, olderBackup.password, true);
      setOlderBackup(null);
      onOpen(r.data, r.key);
    } catch (e) {
      // Any other failure here (e.g. the vault changed underneath us) falls back to the
      // normal error path — no false success, and the person lands back on the form.
      setOlderBackup(null);
      setError(
        e instanceof Error ? e.message : "Impossible d’ouvrir le coffre.",
      );
    } finally {
      setBusy(false);
    }
  }
  function cancelOlderBackup() {
    // Nothing was ever written for this refusal, so canceling is a pure UI reset.
    setOlderBackup(null);
    setError("");
  }
  async function restore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25_000_000) {
      setError("Sauvegarde trop volumineuse (25 Mo maximum).");
      return;
    }
    setOlderBackup(null);
    setBackup(await file.text());
    setError("");
  }
  return (
    <main className="auth-screen">
      <section className="auth-art">
        <div className="brand">
          <img src="./finance.svg" className="brand-mark" alt="" />
          Finance
        </div>
        <p className="eyebrow">VOTRE ARGENT. VOTRE HORIZON.</p>
        <h1>
          Tout voir.
          <br />
          Mieux avancer.
        </h1>
        <p>
          Le budget du quotidien et les projets de demain,
          <br />
          dans un seul espace personnel.
        </p>
        <div className="vault-mark">
          <Icon name="shield" size={56} />
        </div>
        <div className="pill">Privé par conception</div>
      </section>
      <section className="auth-card">
        <div className="brand mobile-brand">
          <img src="./finance.svg" className="brand-mark" alt="" />
          Finance
        </div>
        <p className="eyebrow">BIENVENUE CHEZ VOUS</p>
        <h2 id="auth-heading">
          {olderBackup
            ? "Confirmer la restauration"
            : backup
              ? "Restaurer votre sauvegarde"
              : exists
                ? "Ouvrir mon espace"
                : "Créer mon espace privé"}
        </h2>
        <p className="subtitle">
          {olderBackup
            ? "Cette sauvegarde est plus ancienne que les données déjà présentes sur cet appareil."
            : exists
              ? "Votre phrase secrète déverrouille les données de cet appareil."
              : "Choisissez une phrase secrète de 12 caractères minimum. Elle chiffre vos données sur cet appareil."}
        </p>
        {olderBackup ? (
          <div
            className="older-backup-confirm"
            role="alertdialog"
            aria-labelledby="auth-heading"
            aria-describedby="older-backup-message"
          >
            <p className="notice warning" id="older-backup-message" role="alert">
              {olderBackup.message}
            </p>
            <p className="footer-note">
              Vous êtes sur le point de remplacer les données actuelles de cet
              appareil, plus récentes, par cette sauvegarde plus ancienne.
              Cette action remplacera le coffre de cet appareil.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              className="button primary full-width"
              disabled={busy}
              onClick={confirmOlderBackup}
            >
              {busy ? "Restauration…" : "Restaurer quand même"}
              <Icon name="chevron-right" />
            </button>
            <button
              type="button"
              ref={cancelOlderBackupRef}
              className="button secondary full-width"
              disabled={busy}
              onClick={cancelOlderBackup}
            >
              Annuler
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={submit}>
              <label className="field">
                <span>Phrase secrète</span>
                <input
                  type="password"
                  name="password"
                  autoComplete={exists ? "current-password" : "new-password"}
                  minLength={exists || backup ? 1 : 12}
                  required
                />
              </label>
              {!exists && !backup && (
                <label className="field">
                  <span>Confirmer la phrase secrète</span>
                  <input
                    type="password"
                    name="confirmation"
                    autoComplete="new-password"
                    minLength={12}
                    required
                  />
                </label>
              )}
              {backup && exists && (
                <label className="notice">
                  <input type="checkbox" name="replace" /> Remplacer le
                  coffre de cet appareil par cette sauvegarde.
                </label>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="button primary full-width" disabled={busy}>
                {busy
                  ? "Ouverture…"
                  : backup
                    ? "Restaurer"
                    : exists
                      ? "Déverrouiller"
                      : "Créer mon coffre"}
                <Icon name="chevron-right" />
              </button>
            </form>
            <p className="footer-note">
              La phrase secrète ne peut pas être récupérée. Gardez-la et
              exportez régulièrement une sauvegarde chiffrée.
            </p>
            <div className="auth-links">
              <label className="button secondary">
                Restaurer une sauvegarde
                <input
                  className="sr-only"
                  type="file"
                  accept=".finance-vault,.json"
                  onChange={restore}
                />
              </label>
              <button
                className="button secondary"
                disabled={busy}
                onClick={onDemo}
              >
                Voir la démonstration
              </button>
            </div>
            {backup && (
              <button
                className="text-button"
                onClick={() => {
                  setBackup(null);
                  setOlderBackup(null);
                  setExists(vaultExists());
                }}
              >
                Annuler la restauration
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}
export default function App() {
  const [data, setData] = useState<FinanceData | null>(null),
    [key, setKey] = useState<CryptoKey | null>(null),
    [demo, setDemo] = useState(false),
    [page, setPage] = useState<Page>("overview"),
    [month, setMonth] = useState(today().slice(0, 7)),
    [currency, setCurrency] = useState("CHF"),
    [hidden, setHidden] = useState(false),
    [editor, setEditor] = useState<EditorSpec | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("all"),
    [more, setMore] = useState(false),
    [pendingImport, setPendingImport] = useState<FinanceData | null>(null),
    [busy, setBusy] = useState(false),
    [receiptTxn, setReceiptTxn] = useState("");
  const session = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const mutating = useRef(false);
  const [preview, setPreview] = useState<{
    url: string;
    name: string;
    pdf: boolean;
  } | null>(null);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const lock = useCallback(() => {
    session.current++;
    setData(null);
    setKey(null);
    setDemo(false);
    setEditor(null);
    setPendingImport(null);
    setHidden(false);
    setPreview(null);
    setMessage("");
    setError("");
  }, []);
  useEffect(() => {
    if (!data || demo) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(lock, 5 * 60 * 1000);
    };
    reset();
    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    const hide = () => {
      if (document.hidden) reset();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [data, demo, lock]);
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  useEffect(() => {
    if (preview) previewDialog.current?.showModal();
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);
  const renderSession = session.current;
  function navigate(p: Page) {
    setPage(p);
    setMore(false);
    setFilter("all");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function persist(next: FinanceData) {
    if (session.current !== renderSession)
      throw new Error("Coffre verrouillé.");
    if (mutating.current)
      throw new Error("Un enregistrement est déjà en cours.");
    mutating.current = true;
    const currentSession = session.current;
    try {
      const valid = validateData(next);
      if (!demo) {
        if (!key) throw new Error("Coffre verrouillé.");
        await saveVault(key, valid);
      }
      if (currentSession !== session.current)
        throw new Error("Coffre verrouillé.");
      setData(valid);
      setMessage(
        demo
          ? "Modification de la démonstration (non enregistrée)."
          : "Enregistré dans votre coffre.",
      );
      setError("");
    } finally {
      mutating.current = false;
    }
  }
  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 15_000_000) throw new Error("Import limité à 15 Mo.");
      const raw = await file.text();
      const parsed =
        file.name.toLowerCase().endsWith(".csv") && data
          ? await parseTransactionCsv(raw, data)
          : validateData(JSON.parse(raw));
      if (session.current !== renderSession) return;
      setPendingImport(parsed);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fichier invalide.");
    } finally {
      e.target.value = "";
    }
  }
  async function confirmImport() {
    if (!data || !pendingImport) return;
    setBusy(true);
    try {
      const merged = mergeImport(data, pendingImport);
      await persist(merged);
      setPendingImport(null);
      setMessage("Import enregistré. Consultez les éléments à vérifier.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible.");
    } finally {
      setBusy(false);
    }
  }
  async function attach(
    e: ChangeEvent<HTMLInputElement>,
    transactionId: string | null = receiptTxn || null,
  ) {
    try {
      const file = e.target.files?.[0];
      if (!file || !data) return;
      if (
        !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        )
      )
        throw new Error("Choisissez un PDF, JPEG, PNG ou WebP.");
      if (file.size > 2_000_000)
        throw new Error("Limite de 2 Mo par document.");
      const encoded = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error("Lecture du document impossible."));
        reader.readAsDataURL(file);
      });
      await persist({
        ...data,
        documents: [
          ...data.documents,
          {
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type,
            dataUrl: encoded,
            transactionId,
            addedAt: new Date().toISOString(),
            source: { system: "manual" },
          },
        ],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document non enregistré.");
    } finally {
      e.target.value = "";
    }
  }
  function openDocument(doc: FinanceData["documents"][number]) {
    if (!doc.dataUrl) return;
    const split = doc.dataUrl.split(",");
    try {
      const binary = atob(split[1]);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      setPreview({
        url: URL.createObjectURL(new Blob([bytes], { type: doc.mimeType })),
        name: doc.name,
        pdf: doc.mimeType === "application/pdf",
      });
    } catch {
      setError("Document illisible.");
    }
  }
  if (!data)
    return (
      <Auth
        onOpen={(d, k) => {
          session.current++;
          setData(d);
          setKey(k);
          setCurrency(d.preferences.baseCurrency);
          setDemo(false);
        }}
        onDemo={() => {
          setData(demoData());
          setDemo(true);
          setCurrency("CHF");
        }}
      />
    );
  const available = availableSummary(data, currency, month);
  const wealth = wealthSummary(data, currency),
    summary = monthSummary(data, month, currency),
    transactions = transactionsForMonth(data, month),
    currentPage = pages.find((p) => p.id === page)!;
  const display = (value: number | null, unit = currency) =>
    hidden ? "••••••" : money(value, unit);
  const unknownAccounts = data.accounts.filter((a) => !latestBalance(a)).length;
  const staleAccounts = data.accounts.filter((a) => {
    const b = latestBalance(a);
    return b?.asOf && Date.parse(today()) - Date.parse(b.asOf) > 31 * 86400000;
  }).length;
  const attention = data.reviewItems.length + unknownAccounts + staleAccounts;
  const accountName = (id: string | null) =>
    data.accounts.find((a) => a.id === id)?.name || "Compte à préciser";
  const edit = (spec: EditorSpec) => {
    setError("");
    setEditor(spec);
  };
  const kinds = {
    bank: "Compte bancaire",
    savings: "Épargne",
    investment: "Investissement",
    debt: "Dette",
  };
  function accountCard(a: Account) {
    const b = latestBalance(a),
      unverified = a.balances.at(-1),
      show = b || unverified;
    return (
      <article className="account-card" key={a.id}>
        <div className="account-head">
          <span className="institution-icon">
            {a.institution.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <span className="institution">{a.institution}</span>
            <h3>{a.name}</h3>
          </div>
          <button
            className="icon-button"
            onClick={() => edit({ type: "account", id: a.id })}
            aria-label={`Modifier ${a.name}`}
          >
            <Icon name="edit" size={17} />
          </button>
        </div>
        <div className="balance">
          {display(show?.amountMinor ?? null, a.currency)}
        </div>
        <p className="meta">
          {b?.asOf
            ? `Solde au ${b.asOf}`
            : show
              ? "Non daté · à vérifier"
              : "Solde à renseigner"}{" "}
          · {kinds[a.kind]}
        </p>
        <div className="hero-foot">
          <SourceLink source={show?.source || a.source} />
          <button
            className="button small secondary"
            onClick={() => edit({ type: "balance", id: a.id })}
          >
            <Icon name="refresh" size={16} />
            Actualiser
          </button>
        </div>
        <details className="account-history">
          <summary>Historique et valorisation</summary>
          <p className="footer-note">
            {a.valuationMode === "total"
              ? "Solde total : les positions de ce compte ne sont pas ajoutées."
              : "Solde de liquidités : les positions datées sont ajoutées."}
          </p>
          {a.balances.map((v) => (
            <p className="meta" key={v.id}>
              {v.asOf || "Date inconnue"} · {display(v.amountMinor, a.currency)}
            </p>
          ))}
        </details>
      </article>
    );
  }
  async function settle(t: Transaction) {
    if (!data) return;
    try {
      const next = {
        ...t,
        status: "settled" as const,
        date: today(),
        source: { ...t.source, updatedAt: new Date().toISOString() },
      };
      await persist({
        ...data,
        transactions: [...data.transactions.filter((v) => v.id !== t.id), next],
      });
      setMessage(
        "Paiement confirmé. Actualisez le solde du compte après rapprochement.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Paiement non enregistré.");
    }
  }
  function transactionRow(t: Transaction) {
    return (
      <div className="row" key={t.id}>
        <span
          className={`row-icon ${t.kind === "income" ? "positive" : t.kind === "transfer" ? "neutral" : ""}`}
        >
          <Icon
            name={
              t.kind === "income"
                ? "arrow-down"
                : t.kind === "transfer"
                  ? "transfer"
                  : "arrow-up"
            }
          />
        </span>
        <div className="row-main">
          <span className="row-title">{t.label}</span>
          <span className="row-detail">
            {t.date ||
              (t.budgetMonth
                ? monthLabel(t.budgetMonth) + " · jour à vérifier"
                : "Date à vérifier")}{" "}
            · {accountName(t.accountId)} ·{" "}
            {t.status === "settled"
              ? "Confirmé"
              : t.status === "planned"
                ? "Prévu"
                : "À vérifier"}
            {data?.documents.some((d) => d.transactionId === t.id) &&
              " · Justificatif joint"}
          </span>
        </div>
        <span className={`row-value ${t.kind === "income" ? "positive" : ""}`}>
          {t.kind === "income" ? "+" : ""}
          {display(t.amountMinor, t.currency)}
        </span>
        {t.status === "planned" ? (
          <button
            className="icon-button"
            title="Confirmer le paiement aujourd’hui"
            aria-label={`Confirmer ${t.label}`}
            onClick={() => settle(t)}
          >
            <Icon name="check" size={17} />
          </button>
        ) : null}
        {data?.transactions.some((i) => i.id === t.id) && (
          <>
            {
              // Kept exclusive with the "confirmer" action above so a row never carries
              // three icon buttons at once (crowds the label on an iPhone width). A
              // receipt is also most often at hand once the operation is settled; a
              // planned operation can still be reached from Documents et réglages.
              t.status !== "planned" && (
                <label
                  className="icon-button"
                  aria-label={`Joindre un document à ${t.label}`}
                >
                  <Icon name="document" size={17} />
                  <input
                    className="sr-only"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => attach(e, t.id)}
                  />
                </label>
              )
            }
            <button
              className="icon-button"
              aria-label={`Modifier ${t.label}`}
              onClick={() =>
                edit({ type: "transaction", id: t.id, kind: t.kind })
              }
            >
              <Icon name="edit" size={17} />
            </button>
          </>
        )}
      </div>
    );
  }
  const goals = data.goals.map((g) => {
    const progress =
      g.targetMinor && g.reservedMinor !== null
        ? Math.min(100, (g.reservedMinor / g.targetMinor) * 100)
        : null;
    return (
      <article className="card goal-card" key={g.id}>
        <div className="card-header">
          <div className="row-icon">
            <Icon name="target" />
          </div>
          <button
            className="icon-button"
            onClick={() => edit({ type: "goal", id: g.id })}
            aria-label={`Modifier ${g.name}`}
          >
            <Icon name="edit" size={17} />
          </button>
        </div>
        <h3>{g.name}</h3>
        <div className="balance">{display(g.reservedMinor, g.currency)}</div>
        <p className="meta">
          sur {display(g.targetMinor, g.currency)}
          {g.dueDate ? ` · échéance ${g.dueDate}` : ""}
        </p>
        {!hidden && (
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        )}
        <div className="hero-foot">
          <span className="meta">
            {g.asOf ? `Réserve au ${g.asOf}` : "Réserve non datée"}
          </span>
          <span>
            {hidden
              ? "•••"
              : progress !== null
                ? `${Math.round(progress)} %`
                : "À préciser"}
          </span>
        </div>
        <p className="footer-note">
          {accountName(g.accountId)} · inclus dans ce compte
        </p>
        <SourceLink source={g.source} />
      </article>
    );
  });
  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("overview")}>
          <img className="brand-mark" src="./finance.svg" alt="" />
          Finance
        </button>
        <p className="eyebrow nav-eyebrow">MON ESPACE</p>
        <nav aria-label="Navigation principale">
          {pages.map((p) => (
            <button
              className={`nav-item ${page === p.id ? "active" : ""}`}
              key={p.id}
              onClick={() => navigate(p.id)}
              aria-current={page === p.id ? "page" : undefined}
            >
              <Icon name={p.icon} />
              <span>{p.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="pill">
            <Icon name="shield" size={15} />
            {demo ? "Espace de démonstration" : "Coffre privé"}
          </div>
          <p className="footer-note">
            {demo
              ? "Des exemples pour découvrir Finance."
              : "Chiffré sur cet appareil. Sauvegardez pour transférer vos données."}
          </p>
          <button className="nav-item" onClick={lock}>
            <Icon name="logout" />
            {demo ? "Quitter la démo" : "Verrouiller"}
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            Mon espace <span>/</span> {currentPage.short}
          </div>
          <div className="topbar-actions">
            <span className="pill privacy-pill">
              <span className="status-dot" />
              {demo ? "Démo fictive" : "Privé"}
            </span>
            <button
              className="icon-button"
              onClick={() => setHidden(!hidden)}
              aria-label={
                hidden ? "Afficher les montants" : "Masquer les montants"
              }
            >
              <Icon name={hidden ? "eye-off" : "eye"} />
            </button>
            <button
              className="icon-button"
              onClick={lock}
              aria-label="Verrouiller l’espace"
            >
              <Icon name="lock" />
            </button>
            <span className="avatar">F</span>
          </div>
        </header>
        <div className="page-header">
          <div>
            <p className="eyebrow">VOTRE FINANCE, EN CLAIR</p>
            <h1 className="page-title">
              {page === "overview"
                ? "Une vue sur l’essentiel."
                : currentPage.name}
            </h1>
            <p className="subtitle">
              {page === "overview"
                ? "Vos comptes, votre mois, vos prochains projets."
                : page === "month"
                  ? "Ce qui entre, ce qui sort et ce qui reste à prévoir."
                  : page === "accounts"
                    ? "Chaque compte, avec sa devise et la date de son solde."
                    : page === "goals"
                      ? "Donnez une place à ce qui compte pour vous."
                      : page === "investments"
                        ? "Vos positions, rattachées à leurs comptes."
                        : "Vos pièces et vos données, à portée de main."}
            </p>
          </div>
          <button
            className="button primary"
            onClick={() =>
              edit({
                type:
                  page === "accounts"
                    ? "account"
                    : page === "goals"
                      ? "goal"
                      : page === "investments"
                        ? "position"
                        : "transaction",
              })
            }
          >
            <Icon name="plus" />
            Ajouter
          </button>
        </div>
        {demo && (
          <div className="notice demo-notice">
            Démonstration · Tous les montants et établissements sont fictifs.{" "}
            <button className="text-button" onClick={lock}>
              Ouvrir mon coffre
            </button>
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="notice toast" role="status">
            {message}
          </div>
        )}
        <div className="period-bar">
          <label className="month-picker">
            <Icon name="calendar" size={18} />
            <span className="sr-only">Mois</span>
            <input
              type="month"
              aria-label="Mois"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
            />
          </label>
          <label className="currency-picker">
            <span className="sr-only">Devise d’affichage</span>
            <select
              aria-label="Devise d’affichage"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {[
                ...new Set([
                  "CHF",
                  "EUR",
                  "USD",
                  ...data.accounts.map((a) => a.currency),
                ]),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <span className="meta">{monthLabel(month)}</span>
        </div>
        {page === "overview" && (
          <>
            <div className="dashboard-grid">
              <section className="hero-card">
                <div className="hero-foot">
                  <p className="hero-label">
                    Patrimoine observé{" "}
                    {wealth.partial && <span className="tag">Partiel</span>}
                  </p>
                  <Icon name="chart" />
                </div>
                <div className="hero-value">{display(wealth.totalMinor)}</div>
                <p className="meta">
                  {wealth.partial
                    ? `${wealth.excluded} compte(s) exclu(s) : date, valeur ou taux manquant.`
                    : "Valeurs datées connues, sans double comptage."}
                </p>
                <WealthChart data={data} currency={currency} hidden={hidden} />
                <p className="footer-note">
                  Historique des valeurs disponibles · aucune performance
                  déduite des apports.
                </p>
              </section>
              <Card
                title="Votre mois"
                action={
                  <button
                    className="card-action"
                    onClick={() => navigate("month")}
                  >
                    Détail <Icon name="chevron-right" size={16} />
                  </button>
                }
              >
                <div className="metric">
                  <div className="metric-label">Revenus confirmés</div>
                  <div className="metric-value positive">
                    {display(summary.incomeSettled)}
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label">Dépenses confirmées</div>
                  <div className="metric-value">
                    {display(summary.expenseSettled)}
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label">
                    Disponible après réserves et charges
                  </div>
                  <div className="metric-value">
                    {display(available.amountMinor)}
                  </div>
                  <p className="footer-note">
                    {available.partial
                      ? "À établir avec des soldes bancaires du jour et des engagements rapprochés."
                      : `Estimation au ${available.asOf}, après engagements connus du mois.`}
                  </p>
                </div>
                <div className="metric highlighted">
                  <div className="metric-label">Projection nette du mois</div>
                  <div className="metric-value">
                    {display(summary.remaining)}
                  </div>
                  <p className="footer-note">
                    Revenus prévus et reçus, moins dépenses prévues et payées.
                    Ce n’est pas le solde disponible.
                  </p>
                </div>
              </Card>
            </div>
            <div className="section-heading">
              <h2>Vos comptes</h2>
              <button
                className="card-action"
                onClick={() => navigate("accounts")}
              >
                Tous les comptes <Icon name="chevron-right" size={16} />
              </button>
            </div>
            <div className="account-grid">
              {data.accounts.slice(0, 3).map(accountCard)}
              {!data.accounts.length && (
                <div className="empty-state">
                  <Icon name="wallet" size={30} />
                  <h3>Tout commence par un compte.</h3>
                  <p>Ajoutez un compte ou importez vos données vérifiées.</p>
                  <button
                    className="button secondary"
                    onClick={() => edit({ type: "account" })}
                  >
                    Ajouter un compte
                  </button>
                </div>
              )}
            </div>
            <div className="two-columns">
              <Card title="Répartition du patrimoine">
                <Allocation
                  hidden={hidden}
                  currency={currency}
                  items={wealth.items.flatMap((i) =>
                    i.valueMinor === null
                      ? []
                      : [
                          {
                            name: accountName(i.accountId),
                            value: i.valueMinor,
                          },
                        ],
                  )}
                />
                <p className="footer-note">
                  Actifs positifs uniquement. Dettes déduites du patrimoine
                  total.
                </p>
              </Card>
              <Card
                title="Prochaines échéances"
                action={
                  <button
                    className="card-action"
                    onClick={() => navigate("month")}
                  >
                    Voir tout
                  </button>
                }
              >
                {transactions
                  .filter((t) => t.status === "planned")
                  .slice(0, 4)
                  .map(transactionRow)}
                {!transactions.some((t) => t.status === "planned") && (
                  <div className="empty-state">
                    Aucune échéance connue pour ce mois.
                  </div>
                )}
              </Card>
            </div>
            <Card
              title="À votre attention"
              action={<span className="tag">{attention}</span>}
            >
              {unknownAccounts > 0 && (
                <div className="row">
                  <Icon name="alert" />
                  <div className="row-main">
                    <span className="row-title">
                      {unknownAccounts} compte(s) sans solde daté
                    </span>
                    <span className="row-detail">
                      Ils ne sont pas inclus dans le total.
                    </span>
                  </div>
                  <button
                    className="card-action"
                    onClick={() => navigate("accounts")}
                  >
                    Vérifier
                  </button>
                </div>
              )}
              {staleAccounts > 0 && (
                <p className="warning">
                  {staleAccounts} solde(s) datent de plus de 31 jours.
                </p>
              )}
              {data.reviewItems.length > 0 && (
                <button
                  className="nav-item"
                  onClick={() => navigate("documents")}
                >
                  <Icon name="document" />
                  {data.reviewItems.length} informations importées à rapprocher
                  <Icon name="chevron-right" />
                </button>
              )}
              {!attention && (
                <p className="meta">
                  Aucune information à rapprocher dans les données présentes.
                </p>
              )}
            </Card>
          </>
        )}
        {page === "month" && (
          <>
            <div className="stat-grid">
              {[
                { label: "Revenus reçus", v: summary.incomeSettled },
                { label: "Revenus attendus", v: summary.incomePlanned },
                { label: "Dépenses payées", v: summary.expenseSettled },
                { label: "Dépenses prévues", v: summary.expensePlanned },
              ].map((s) => (
                <div className="stat-card" key={s.label}>
                  <p className="metric-label">{s.label}</p>
                  <div className="metric-value">{display(s.v)}</div>
                </div>
              ))}
            </div>
            <div className="two-columns">
              <Card title="Le mouvement du mois">
                <FlowChart
                  income={
                    summary.incomePlanned === null ||
                    summary.incomeSettled === null
                      ? null
                      : summary.incomePlanned + summary.incomeSettled
                  }
                  expense={
                    summary.expensePlanned === null ||
                    summary.expenseSettled === null
                      ? null
                      : summary.expensePlanned + summary.expenseSettled
                  }
                  currency={currency}
                  hidden={hidden}
                />
              </Card>
              <Card title="Projection nette">
                <div className="hero-value compact">
                  {display(summary.remaining)}
                </div>
                <p className="footer-note">
                  Virements internes exclus. Cette projection utilise toutes les
                  entrées et dépenses connues du mois ; elle ne remplace pas les
                  soldes de vos comptes.
                </p>
                {summary.unknownCount > 0 && (
                  <p className="warning">
                    {summary.unknownCount} élément(s) à vérifier.
                  </p>
                )}
              </Card>
            </div>
            <Card
              title="Les opérations"
              action={
                <button
                  className="card-action"
                  onClick={() => edit({ type: "transaction", kind: "income" })}
                >
                  + Revenu
                </button>
              }
            >
              <div className="tab-bar">
                {[
                  ["all", "Tout"],
                  ["income", "Revenus"],
                  ["expense", "Dépenses"],
                  ["transfer", "Virements"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    className={`tab-button ${filter === v ? "active" : ""}`}
                    onClick={() => setFilter(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {transactions
                .filter((t) => filter === "all" || t.kind === filter)
                .map(transactionRow)}
              {!transactions.length && (
                <div className="empty-state">
                  Aucune opération datée pour ce mois.
                </div>
              )}
            </Card>
            <Card title="Opérations à dater">
              {data.transactions
                .filter((t) => !t.date && !t.budgetMonth)
                .map(transactionRow)}
              {!data.transactions.some((t) => !t.date && !t.budgetMonth) && (
                <p className="meta">
                  Toutes les opérations enregistrées ont une date.
                </p>
              )}
            </Card>
            <Card
              title="Charges récurrentes"
              action={
                <button
                  className="card-action"
                  onClick={() => edit({ type: "recurrence" })}
                >
                  Ajouter une récurrence
                </button>
              }
            >
              {data.recurrences.map((r) => (
                <div className="row" key={r.id}>
                  <span className="row-icon">
                    <Icon name="refresh" />
                  </span>
                  <div className="row-main">
                    <span className="row-title">{r.label}</span>
                    <span className="row-detail">
                      Le {r.day} · tous les {r.intervalMonths} mois ·{" "}
                      {r.active ? "active" : "en pause"}
                    </span>
                  </div>
                  <span className="row-value">
                    {display(r.amountMinor, r.currency)}
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Modifier ${r.label}`}
                    onClick={() => edit({ type: "recurrence", id: r.id })}
                  >
                    <Icon name="edit" />
                  </button>
                </div>
              ))}
              {!data.recurrences.length && (
                <div className="empty-state">
                  Vos abonnements et charges récurrentes apparaîtront ici.
                </div>
              )}
            </Card>
          </>
        )}
        {page === "accounts" && (
          <>
            <div className="notice">
              Les soldes conservent leur date d’observation. Les opérations du
              mois ne les modifient pas automatiquement.
            </div>
            <div className="account-grid">{data.accounts.map(accountCard)}</div>
            {!data.accounts.length && (
              <div className="empty-state">
                Ajoutez votre premier compte ou importez un fichier Finance.
              </div>
            )}
          </>
        )}
        {page === "goals" && (
          <>
            <div className="notice">
              Vos réserves font déjà partie de vos comptes. Elles sont suivies
              ici sans augmenter le patrimoine.
            </div>
            <div className="three-columns">{goals}</div>
            {!goals.length && (
              <div className="empty-state">
                <Icon name="target" size={36} />
                <h2>Un projet, une place à part.</h2>
                <p>
                  Impôts, réserve de sécurité ou prochain voyage : fixez votre
                  objectif.
                </p>
                <button
                  className="button secondary"
                  onClick={() => edit({ type: "goal" })}
                >
                  Créer un projet
                </button>
              </div>
            )}
          </>
        )}
        {page === "investments" && (
          <>
            <div className="notice">
              La valeur des positions est datée. Pour chaque compte, Finance
              utilise soit sa valeur totale, soit ses liquidités et ses
              positions.
            </div>
            <Card title="Vos positions">
              <div className="tab-bar">
                {[
                  ["all", "Tout"],
                  ["stock", "Actions"],
                  ["etf", "ETF"],
                  ["option", "Options"],
                  ["crypto", "Crypto"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    className={`tab-button ${filter === v ? "active" : ""}`}
                    onClick={() => setFilter(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {data.positions
                .filter((p) => filter === "all" || p.assetType === filter)
                .map((p) => (
                  <div className="row" key={p.id}>
                    <span className="institution-icon">
                      {(p.symbol || p.name).slice(0, 2)}
                    </span>
                    <div className="row-main">
                      <span className="row-title">
                        {p.name}{" "}
                        <span className="tag">{p.assetType.toUpperCase()}</span>
                      </span>
                      <span className="row-detail">
                        {accountName(p.accountId)} ·{" "}
                        {hidden ? "•••" : p.quantity || "Quantité inconnue"} ·{" "}
                        {p.asOf || "Non daté"}
                      </span>
                    </div>
                    <span className="row-value">
                      {display(p.valueMinor, p.currency)}
                    </span>
                    <button
                      className="icon-button"
                      aria-label={`Modifier ${p.name}`}
                      onClick={() => edit({ type: "position", id: p.id })}
                    >
                      <Icon name="edit" />
                    </button>
                  </div>
                ))}
              {!data.positions.length && (
                <div className="empty-state">
                  Aucune position vérifiée. Ajoutez une position ou importez vos
                  données.
                </div>
              )}
            </Card>
            <div className="account-grid">
              {data.accounts
                .filter((a) => a.kind === "investment")
                .map(accountCard)}
            </div>
          </>
        )}
        {page === "documents" && (
          <>
            <div className="two-columns">
              <Card title="Imports et sauvegardes">
                <p className="footer-note">
                  Import Finance JSON ou CSV avec rapprochement des doublons.
                  Une sauvegarde chiffrée transporte le coffre complet vers un
                  autre appareil.
                </p>
                <input
                  type="file"
                  ref={fileInput}
                  hidden
                  accept=".json,.csv"
                  onChange={importFile}
                />
                <div className="action-stack">
                  <button
                    className="button secondary"
                    onClick={() =>
                      download(
                        CSV_TEMPLATE,
                        "Finance-exemple-fictif.csv",
                        "text/csv;charset=utf-8",
                      )
                    }
                  >
                    <Icon name="document" />
                    Modèle CSV (exemples fictifs)
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => fileInput.current?.click()}
                  >
                    <Icon name="upload" />
                    Importer un fichier Finance ou CSV
                  </button>
                  <button
                    className="button secondary"
                    disabled={demo}
                    onClick={() => {
                      try {
                        download(
                          exportVault(),
                          `Finance-${today()}.finance-vault`,
                        );
                      } catch (e) {
                        setError(String(e));
                      }
                    }}
                  >
                    <Icon name="download" />
                    Sauvegarde chiffrée
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      download(
                        JSON.stringify(data, null, 2),
                        `Finance-${today()}.json`,
                      )
                    }
                  >
                    <Icon name="download" />
                    Exporter les données JSON (non chiffrées)
                  </button>
                </div>
                <p className="footer-note">
                  L’export JSON contient vos données privées. Conservez-le dans
                  un emplacement protégé.
                </p>
              </Card>
              <Card title="Préférences et synchronisation">
                <label className="field">
                  <span>Devise principale</span>
                  <select
                    value={data.preferences.baseCurrency}
                    onChange={(e) =>
                      persist({
                        ...data,
                        preferences: {
                          ...data.preferences,
                          baseCurrency: e.target.value,
                        },
                      }).catch((e) => setError(String(e)))
                    }
                  >
                    {["CHF", "EUR", "USD"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <p className="meta">
                  Appareil local · verrouillage après 5 minutes d’inactivité.
                </p>
                <p className="footer-note">
                  Synchronisation bancaire et entre appareils : non configurée.
                  Transférez une sauvegarde chiffrée, puis restaurez-la à
                  l’ouverture sur l’autre appareil.
                </p>
                <button
                  className="button secondary"
                  onClick={() => edit({ type: "fx" })}
                >
                  <Icon name="transfer" />
                  Ajouter un taux de change daté
                </button>
                <div className="rates">
                  {data.fxRates.map((r, i) => (
                    <p className="meta" key={i}>
                      {hidden ? "•••" : `1 ${r.from} = ${r.rate} ${r.to}`} ·{" "}
                      {r.asOf}
                    </p>
                  ))}
                </div>
              </Card>
            </div>
            {pendingImport && (
              <Card title="Vérifier cet import">
                <p>
                  {pendingImport.accounts.length} comptes ·{" "}
                  {pendingImport.transactions.length} opérations ·{" "}
                  {pendingImport.positions.length} positions ·{" "}
                  {pendingImport.reviewItems.length} éléments à rapprocher.
                </p>
                <p className="footer-note">
                  Les éléments identiques seront ignorés et les conflits
                  conservés pour vérification.
                </p>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={confirmImport}
                >
                  {busy ? "Import…" : "Confirmer l’import"}
                </button>{" "}
                <button
                  className="button secondary"
                  onClick={() => setPendingImport(null)}
                >
                  Annuler
                </button>
              </Card>
            )}
            <Card title="Reçus et documents">
              <div className="form-grid">
                <label className="field">
                  <span>Lier à une opération (facultatif)</span>
                  <select
                    value={receiptTxn}
                    onChange={(e) => setReceiptTxn(e.target.value)}
                  >
                    <option value="">Sans opération</option>
                    {data.transactions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} · {t.date || "Non daté"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="button secondary">
                  <Icon name="plus" />
                  Joindre un reçu
                  <input
                    className="sr-only"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={attach}
                  />
                </label>
              </div>
              <p className="footer-note">
                PDF ou image · 2 Mo par document · conservé dans le coffre
                chiffré.
              </p>
              {data.documents.map((d) => (
                <div className="row" key={d.id}>
                  <span className="row-icon">
                    <Icon name="document" />
                  </span>
                  <div className="row-main">
                    <span className="row-title">{d.name}</span>
                    <span className="row-detail">
                      {d.addedAt.slice(0, 10)} ·{" "}
                      {d.transactionId
                        ? data.transactions.find(
                            (t) => t.id === d.transactionId,
                          )?.label
                        : "Sans opération"}
                    </span>
                  </div>
                  {d.dataUrl && (
                    <button
                      className="button small secondary"
                      onClick={() => openDocument(d)}
                    >
                      Ouvrir
                    </button>
                  )}
                  {d.url && /^https:\/\/(www\.)?notion\.so\//.test(d.url) && (
                    <a
                      className="button small secondary"
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Dans Notion ↗
                    </a>
                  )}
                </div>
              ))}
              {!data.documents.length && (
                <div className="empty-state">
                  Vos justificatifs retrouveront ici leurs opérations.
                </div>
              )}
            </Card>
            <Card title="Informations à vérifier">
              {hidden ? (
                <p className="meta">Informations masquées.</p>
              ) : (
                data.reviewItems.slice(0, 100).map((r) => (
                  <div className="review-item" key={r.id}>
                    <h3>{r.title}</h3>
                    <p>{r.reason}</p>
                    <SourceLink source={r.source} />
                  </div>
                ))
              )}
              {data.reviewItems.length > 100 && (
                <p className="footer-note">
                  100 éléments affichés sur {data.reviewItems.length}. L’export
                  conserve la totalité.
                </p>
              )}
              {!data.reviewItems.length && (
                <p className="meta">
                  Aucune information en attente de rapprochement.
                </p>
              )}
            </Card>
          </>
        )}
        <footer className="footer-note page-footer">
          Finance ·{" "}
          {demo
            ? "Espace de démonstration · exemples fictifs"
            : "Espace privé sur cet appareil"}{" "}
          · Soldes observés, sources conservées.
        </footer>
      </main>
      <nav className="mobile-nav" aria-label="Navigation mobile">
        {pages.slice(0, 3).map((p) => (
          <button
            key={p.id}
            className={page === p.id ? "active" : ""}
            onClick={() => navigate(p.id)}
            aria-current={page === p.id ? "page" : undefined}
          >
            <Icon name={p.icon} />
            <span>{p.short}</span>
          </button>
        ))}
        <button
          onClick={() => setMore(!more)}
          className={
            more || !["overview", "month", "accounts"].includes(page)
              ? "active"
              : ""
          }
          aria-expanded={more}
        >
          <Icon name="more" />
          <span>Plus</span>
        </button>
      </nav>
      {more && (
        <div className="mobile-more">
          {pages.slice(3).map((p) => (
            <button
              className="nav-item"
              key={p.id}
              onClick={() => navigate(p.id)}
            >
              <Icon name={p.icon} />
              {p.name}
            </button>
          ))}
        </div>
      )}
      {editor && (
        <Editor
          key={`${editor.type}-${editor.id || "new"}`}
          spec={editor}
          data={data}
          onSave={persist}
          onClose={() => setEditor(null)}
        />
      )}
      {preview && (
        <dialog
          className="dialog document-dialog"
          aria-labelledby="document-title"
          ref={previewDialog}
          onCancel={() => setPreview(null)}
        >
          <div className="dialog-header">
            <h2 id="document-title">{preview.name}</h2>
            <button
              className="icon-button"
              onClick={() => setPreview(null)}
              aria-label="Fermer le document"
            >
              <Icon name="close" />
            </button>
          </div>
          {preview.pdf ? (
            <>
              <p>Le document est prêt.</p>
              <a
                className="button primary"
                href={preview.url}
                download={preview.name}
              >
                Télécharger le PDF
              </a>
            </>
          ) : (
            <img
              src={preview.url}
              alt={preview.name}
              style={{ maxWidth: "100%" }}
            />
          )}
        </dialog>
      )}
    </div>
  );
}
