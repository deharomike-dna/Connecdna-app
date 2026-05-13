/**
 * Persistent disclosure banner shown above transaction / settlement / escrow-like
 * / payment-orchestration / connected-banking workflows. Required by the user's
 * placement architecture and the Document 6 framework.
 */
export function DisclosureBanner() {
  return (
    <div className="disclosure-banner" role="note" aria-label="Non-custodial disclosure">
      <strong>ConneCDNA does not hold, custody, transmit, or control customer funds.</strong>{" "}
      Payment activity is performed by third-party financial institutions, banks, payment
      processors, or connected API providers. ConneCDNA provides software-based workflow
      coordination, identity verification, audit logging, transaction readiness, execution
      orchestration, and compliance infrastructure only.
      <div style={{ marginTop: 6, fontSize: "0.78rem", opacity: 0.85 }}>
        ConneCDNA is a platform operated by Silvermoon Capital LLC.
      </div>
    </div>
  );
}
