import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <span className="pill">An affiliate platform of Silvermoon Capital LLC</span>
      <h1>Software infrastructure for orchestrated trust.</h1>
      <p>
        ConneCDNA provides workflow orchestration, identity continuity, verification,
        and audit infrastructure for healthcare, finance, logistics, government, and
        enterprise. Regulated payment, banking, and identity activity is performed by
        licensed third-party providers. ConneCDNA is software — and only software.
      </p>
      <p style={{ marginTop: 28 }}>
        <Link href="/platform">Learn about the platform →</Link>
        <span style={{ margin: "0 12px", color: "var(--fg-muted)" }}>·</span>
        <Link href="/legal">Read the legal framework →</Link>
      </p>
    </section>
  );
}
