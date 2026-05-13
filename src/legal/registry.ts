// src/legal/registry.ts
//
// Static catalog of every legal document the mobile app is aware of.
// Mirrors the seed data inserted by the SQL migration. The actual rendered
// body is loaded from /assets/legal/<slug>.md (see scripts/sync-legal-to-mobile.ts)
// so the same canonical MDX text is shown on web and mobile.
//
// IMPORTANT: when a new policy is added, add a row here AND drop the
// corresponding .md file under /assets/legal so the PolicyViewer can find it.

import type { LegalCategory, LegalSlug } from './types'

export interface LegalRegistryEntry {
  slug: LegalSlug
  title: string
  category: LegalCategory
  required: boolean              // shown in the registration acceptance checkboxes
  requiresReacceptOnUpdate: boolean
  webRoute: string               // public website route, used by "Open on web" button
  shortDescription: string
}

export const LEGAL_REGISTRY: readonly LegalRegistryEntry[] = [
  {
    slug: 'terms',
    title: 'Terms of Service',
    category: 'core',
    required: true,
    requiresReacceptOnUpdate: true,
    webRoute: '/legal/terms',
    shortDescription:
      'Master agreement governing access to and use of the ConneCDNA platform.',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    category: 'core',
    required: true,
    requiresReacceptOnUpdate: true,
    webRoute: '/legal/privacy',
    shortDescription:
      'How ConneCDNA collects, uses, and protects information across the platform.',
  },
  {
    slug: 'fees',
    title: 'Fee Disclosure Policy',
    category: 'core',
    required: true,
    requiresReacceptOnUpdate: true,
    webRoute: '/legal/fees',
    shortDescription:
      'Distinguishes Platform Fees (charged by ConneCDNA) from Third-Party Service Fees.',
  },
  {
    slug: 'non-custodial',
    title: 'Non-Custodial Disclosure',
    category: 'disclosure',
    required: true,
    requiresReacceptOnUpdate: true,
    webRoute: '/legal/non-custodial',
    shortDescription:
      'ConneCDNA does not hold, custody, transmit, or control customer funds.',
  },
  {
    slug: 'payment-processor',
    title: 'Third-Party Processor Disclosure',
    category: 'core',
    required: true,
    requiresReacceptOnUpdate: true,
    webRoute: '/legal/payment-processor',
    shortDescription:
      'Stripe, Plaid, Mercury, Airwallex, and other licensed processor relationships.',
  },
  {
    slug: 'api-data',
    title: 'API & Data Usage Disclosure',
    category: 'disclosure',
    required: true,
    requiresReacceptOnUpdate: true,
    webRoute: '/legal/api-data',
    shortDescription:
      'Categories of API connections, user authorizations, and security responsibilities.',
  },
  {
    slug: 'identity-verification',
    title: 'Identity Verification Disclosure',
    category: 'disclosure',
    required: true,
    requiresReacceptOnUpdate: true,
    webRoute: '/legal/identity-verification',
    shortDescription:
      'KYC, KYB, and sanctions screening are performed by licensed identity providers.',
  },
  {
    slug: 'compliance-audit',
    title: 'Compliance & Audit Logging Disclosure',
    category: 'disclosure',
    required: true,
    requiresReacceptOnUpdate: true,
    webRoute: '/legal/compliance-audit',
    shortDescription:
      'Append-only audit logs and compliance evidence trails.',
  },
  {
    slug: 'risk-liability',
    title: 'Platform Risk Allocation & Liability Limitation',
    category: 'framework',
    required: false,
    requiresReacceptOnUpdate: false,
    webRoute: '/legal/risk-liability',
    shortDescription:
      'How risk is allocated across customer, ConneCDNA, and third-party providers.',
  },
] as const

export const REQUIRED_AT_SIGNUP: readonly LegalRegistryEntry[] =
  LEGAL_REGISTRY.filter((d) => d.required)

export function getEntry(slug: LegalSlug): LegalRegistryEntry | undefined {
  return LEGAL_REGISTRY.find((d) => d.slug === slug)
}
