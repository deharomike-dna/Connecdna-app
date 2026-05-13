// src/legal/types.ts
// Shared type contracts for the mobile Legal & Compliance subsystem.

export type LegalCategory = 'core' | 'disclosure' | 'framework'

export type LegalSlug =
  | 'terms'
  | 'privacy'
  | 'fees'
  | 'payment-processor'
  | 'non-custodial'
  | 'api-data'
  | 'compliance-audit'
  | 'identity-verification'
  | 'risk-liability'
  | 'transaction-flow-memo'

export interface LegalDocumentMeta {
  slug: LegalSlug
  title: string
  category: LegalCategory
  version: string
  effectiveDate: string
  lastUpdated: string
  requiredAtSignup: boolean
  requiresReacceptOnUpdate: boolean
  contentSha256: string
}

/** Acceptance contexts mirror the values in policy_acceptances.acceptance_context. */
export type AcceptanceContext =
  | 'signup'
  | 'reacceptance'
  | 'transaction'
  | 'enterprise_msa'

export type WorkflowType =
  | 'payment'
  | 'settlement'
  | 'escrow_like'
  | 'banking'
  | 'identity'

export interface AcceptancePayload {
  documentSlug: LegalSlug
  policyVersionId: string
  contentSha256: string
  acceptanceContext: AcceptanceContext
  geographicRegion?: string
  jurisdiction?: string
}
