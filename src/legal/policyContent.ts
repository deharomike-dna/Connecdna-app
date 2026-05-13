// src/legal/policyContent.ts
//
// Static map of legal slugs to imported markdown bodies. The .md files under
// /assets/legal are kept in sync with /legal-content/*.mdx by the
// scripts/sync-legal-to-mobile.ts script (run on every deploy).
//
// We bundle markdown rather than fetch at runtime so the policy text is
// always available offline — required for App Store / Play Store review and
// for the in-app Legal Center disclosure architecture.

// @ts-ignore — Metro will treat .md as a string asset (configured in metro.config.js).
import termsBody from '../../assets/legal/terms.md'
// @ts-ignore
import privacyBody from '../../assets/legal/privacy.md'
// @ts-ignore
import feesBody from '../../assets/legal/fees.md'
// @ts-ignore
import paymentProcessorBody from '../../assets/legal/payment-processor.md'
// @ts-ignore
import nonCustodialBody from '../../assets/legal/non-custodial.md'
// @ts-ignore
import apiDataBody from '../../assets/legal/api-data.md'
// @ts-ignore
import complianceAuditBody from '../../assets/legal/compliance-audit.md'
// @ts-ignore
import identityVerificationBody from '../../assets/legal/identity-verification.md'
// @ts-ignore
import riskLiabilityBody from '../../assets/legal/risk-liability.md'

import type { LegalSlug } from './types'

export const POLICY_BODIES: Record<LegalSlug, string> = {
  'terms': termsBody as string,
  'privacy': privacyBody as string,
  'fees': feesBody as string,
  'payment-processor': paymentProcessorBody as string,
  'non-custodial': nonCustodialBody as string,
  'api-data': apiDataBody as string,
  'compliance-audit': complianceAuditBody as string,
  'identity-verification': identityVerificationBody as string,
  'risk-liability': riskLiabilityBody as string,
  // The Transaction Flow Memo is internal-only and is not bundled in the mobile app.
  'transaction-flow-memo': '',
}
