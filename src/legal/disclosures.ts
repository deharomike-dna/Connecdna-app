// src/legal/disclosures.ts
//
// Single source of truth for the standardized disclaimer strings shown across
// the app. Mirrors the language in /legal-content/non-custodial.mdx (sections 2-3).
// Import these constants instead of inlining new strings, so language stays
// consistent with what users have legally accepted.

export const NON_CUSTODIAL_LONG_FORM =
  'ConneCDNA is a software platform owned and licensed by Silvermoon Capital LLC. ' +
  'ConneCDNA provides workflow orchestration, verification infrastructure, identity continuity, ' +
  'audit logging, and execution-readiness tooling. ConneCDNA is not a bank, money transmitter, ' +
  'money-services business, escrow agent, payment processor, payment facilitator, broker-dealer, ' +
  'investment adviser, or fiduciary. ConneCDNA does not at any time take possession, custody, ' +
  'or control of customer funds. All payment, banking, settlement, and identity-verification ' +
  'activity occurs through licensed and regulated third-party providers, including, where ' +
  'applicable, Stripe, Plaid, Mercury, Airwallex, and other banking and payment APIs.'

export const NON_CUSTODIAL_SHORT_FORM =
  'ConneCDNA is software infrastructure. Payments, banking, and settlement are performed by ' +
  'licensed third-party providers. ConneCDNA does not hold customer funds.'

export const TRANSACTION_BANNER_TEXT =
  'ConneCDNA does not hold, custody, transmit, or control customer funds. Payment activity is ' +
  'performed by third-party financial institutions, banks, payment processors, or connected API ' +
  'providers. ConneCDNA provides software-based workflow coordination, identity verification, ' +
  'audit logging, transaction readiness, execution orchestration, and compliance infrastructure only.'

export const SIGNUP_ACCEPTANCE_LINE =
  'By creating an account, you agree to the Terms of Service, Privacy Policy, Fee Disclosure ' +
  'Policy, Non-Custodial Disclosure, and Third-Party Processor Disclosure.'

export const INTEGRATIONS_DISCLOSURE =
  'ConneCDNA orchestrates connections to Stripe, Plaid, Mercury, Airwallex, and other licensed ' +
  'banking and payment APIs. ConneCDNA is not a bank or money transmitter. All regulated ' +
  'financial activity occurs through these third-party regulated entities under their own terms.'

/** Label used by the audit log writer so all bannered events share a key. */
export const TX_DISCLOSURE_VERSION = 'v1.1.0'

/**
 * Mandatory operator attribution rendered in product footers, the in-app
 * Legal Center, and policy viewer chrome. Short form is used in narrow
 * UX surfaces; long form is used in footer attribution bands.
 */
export const OPERATOR_ATTRIBUTION_SHORT =
  'ConneCDNA is a platform operated by Silvermoon Capital LLC.'

export const OPERATOR_ATTRIBUTION_LONG =
  'ConneCDNA is a platform operated by Silvermoon Capital LLC. ' +
  'All intellectual property rights reserved.'
