import Link from "next/link";
import { FOOTER_LABELS, PUBLIC_FOOTER_SLUGS } from "@/lib/legal";

/**
 * Permanent "Legal" footer rendered on every public page (Document 6,
 * Section 7 — short-form non-custodial language plus links to all
 * eight required legal disclosures).
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="grid">
        <div>
          <h4>ConneCDNA</h4>
          <p style={{ margin: 0 }}>
            Software platform for workflow orchestration, verification, identity continuity,
            and audit infrastructure. Owned and licensed by{" "}
            <strong style={{ color: "var(--fg)" }}>Silvermoon Capital LLC</strong>.
          </p>
        </div>
        <div>
          <h4>Platform</h4>
          <ul>
            <li><Link href="/platform">Platform overview</Link></li>
            <li><Link href="/enterprise">Enterprise</Link></li>
            <li><Link href="/integrations">Integrations</Link></li>
            <li><Link href="/security">Security</Link></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            {PUBLIC_FOOTER_SLUGS.map((slug) => (
              <li key={slug}>
                <Link href={`/legal/${slug}`}>{FOOTER_LABELS[slug]}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="legal-attrib">
        <p style={{ margin: "0 0 6px", color: "var(--fg)", fontWeight: 600 }}>
          ConneCDNA is a platform operated by Silvermoon Capital LLC.
        </p>
        <p style={{ margin: "0 0 6px" }}>
          ConneCDNA is software infrastructure. Payments, banking, and settlement are
          performed by licensed third-party providers. ConneCDNA does not hold customer funds.
        </p>
        <p style={{ margin: 0 }}>
          © {year} Silvermoon Capital LLC. All intellectual property rights reserved.
          ConneCDNA, the ConneCDNA logo, and related marks are trademarks of Silvermoon Capital LLC.
        </p>
      </div>
    </footer>
  );
}
