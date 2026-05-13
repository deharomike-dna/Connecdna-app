import Link from "next/link";
import type { Metadata } from "next";
import { loadAllLegalDocuments } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal Framework",
  description:
    "ConneCDNA legal and compliance framework, covering Terms of Service, Privacy, Fee Disclosure, Non-Custodial Disclosure, Third-Party Processor Disclosure, API & Data Usage, Identity Verification, and Compliance & Audit Logging.",
};

const CATEGORY_BLURB: Record<string, string> = {
  core: "Master agreements that govern access to and use of the Platform.",
  disclosure: "Operational disclosures shown across product surfaces.",
  framework: "Internal frameworks that govern how risk and IP are allocated.",
};

export default function LegalIndexPage() {
  const docs = loadAllLegalDocuments().sort((a, b) => {
    const order = ["core", "disclosure", "framework"];
    const ca = order.indexOf(a.meta.category);
    const cb = order.indexOf(b.meta.category);
    if (ca !== cb) return ca - cb;
    return a.meta.title.localeCompare(b.meta.title);
  });

  const grouped = docs.reduce<Record<string, typeof docs>>((acc, d) => {
    (acc[d.meta.category] ||= []).push(d);
    return acc;
  }, {});

  return (
    <section className="legal-index">
      <h1>Legal & Compliance Framework</h1>
      <p className="lede">
        ConneCDNA operates as an affiliate platform entity under{" "}
        <strong>Silvermoon Capital LLC</strong>, which owns the underlying intellectual
        property, infrastructure, execution systems, orchestration systems, identity
        systems, API frameworks, trademarks, and platform rights. The documents below
        govern access to and use of the Platform and disclose how the Platform interacts
        with licensed third-party financial and identity providers.
      </p>
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.35rem", marginBottom: 4 }}>
            {cat[0].toUpperCase() + cat.slice(1)} documents
          </h2>
          <p style={{ color: "var(--fg-muted)", marginTop: 0, marginBottom: 20 }}>
            {CATEGORY_BLURB[cat]}
          </p>
          <div className="grid">
            {list.map((d) => (
              <Link
                key={d.meta.slug}
                href={`/legal/${d.meta.slug}`}
                className="card"
                style={{ color: "inherit" }}
              >
                <span className="cat">{d.meta.category}</span>
                <h3>{d.meta.title}</h3>
                <p>
                  Version {d.meta.version} · Effective {d.meta.effectiveDate}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
