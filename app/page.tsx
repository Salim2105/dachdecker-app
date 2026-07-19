import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-medium">Bereit für die Gesellenprüfung</h1>
      <p className="mt-2" style={{ color: "var(--text-muted)" }}>
        Übe alle Lernfelder — vom Material bis zum Bau.
      </p>
      <Link
        href="/lernen"
        className="mt-6 inline-flex items-center rounded-xl px-5 py-3 font-medium"
        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
      >
        Lernen starten
      </Link>
    </div>
  );
}
