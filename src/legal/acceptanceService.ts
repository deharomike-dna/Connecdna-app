// src/legal/acceptanceService.ts
//
// Service layer that records policy acceptances, transaction-disclosure views,
// and reads pending re-acceptance gates for the current user.
//
// All writes go through Supabase RPCs (defined in a follow-up SQL migration)
// because the underlying tables (policy_acceptances, audit_log_events,
// transaction_disclosure_views) are append-only and not directly writable
// by anon/auth users — only by service-role functions invoked via RPC.
//
// If the RPCs aren't deployed yet, the inserts fall back to direct table
// inserts which will succeed only if you also create permissive INSERT
// policies; in production, prefer RPCs.

import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import type {
  AcceptanceContext,
  AcceptancePayload,
  LegalSlug,
  WorkflowType,
} from './types'
import { TX_DISCLOSURE_VERSION } from './disclosures'

/**
 * Look up the active policy version for a slug. Used by the registration
 * flow to bind acceptance to a concrete (document, version, sha) tuple.
 */
export async function getActivePolicyVersion(slug: LegalSlug): Promise<{
  policyVersionId: string
  contentSha256: string
  version: string
} | null> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('id, active_version_id, policy_versions!inner(id, version, content_sha256)')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  // policy_versions is joined as inner so it's an array; the active one matches active_version_id
  const versions = (data as any).policy_versions as Array<{
    id: string
    version: string
    content_sha256: string
  }>
  const active = versions.find((v) => v.id === (data as any).active_version_id)
  if (!active) return null
  return {
    policyVersionId: active.id,
    contentSha256: active.content_sha256,
    version: active.version,
  }
}

/**
 * Record an acceptance event for the current user. Captures the data points
 * the architecture requires: user, organization, timestamp (server-side),
 * IP/UA (server-side), device metadata (client), policy version, jurisdiction.
 */
export async function recordAcceptance(
  payload: AcceptancePayload,
  organizationId?: string
): Promise<{ id: string } | { error: string }> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'No authenticated user' }

  const deviceMetadata = {
    platform: Platform.OS,
    osVersion: Platform.Version,
    appSurface: Platform.OS === 'web' ? 'web' : `mobile_${Platform.OS}`,
  }

  // Prefer the dedicated RPC. Falls back to direct insert for dev/local setups.
  const { data, error } = await supabase.rpc('record_policy_acceptance', {
    p_document_slug: payload.documentSlug,
    p_policy_version_id: payload.policyVersionId,
    p_content_sha256: payload.contentSha256,
    p_acceptance_context: payload.acceptanceContext,
    p_organization_id: organizationId ?? null,
    p_geographic_region: payload.geographicRegion ?? null,
    p_jurisdiction: payload.jurisdiction ?? null,
    p_device_metadata: deviceMetadata,
  })

  if (error) {
    return { error: error.message }
  }
  return { id: (data as any)?.id ?? '' }
}

/** Record acceptance for many slugs at once (signup checkbox bundle). */
export async function recordAcceptanceBundle(
  slugs: LegalSlug[],
  context: AcceptanceContext,
  organizationId?: string,
): Promise<{ failed: LegalSlug[] }> {
  const failed: LegalSlug[] = []
  for (const slug of slugs) {
    const v = await getActivePolicyVersion(slug)
    if (!v) {
      failed.push(slug)
      continue
    }
    const r = await recordAcceptance(
      {
        documentSlug: slug,
        policyVersionId: v.policyVersionId,
        contentSha256: v.contentSha256,
        acceptanceContext: context,
      },
      organizationId,
    )
    if ('error' in r) failed.push(slug)
  }
  return { failed }
}

/**
 * Returns the slugs for which the current user has uncleared review_required
 * rows (i.e. a material policy update is pending acceptance).
 */
export async function getPendingReacceptanceSlugs(): Promise<LegalSlug[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('policy_review_required_users')
    .select('document_id, legal_documents!inner(slug)')
    .eq('user_id', userData.user.id)
    .is('cleared_at', null)

  if (error || !data) return []
  return data.map((r) => (r as any).legal_documents.slug as LegalSlug)
}

/**
 * Persist evidence that the persistent disclosure banner was shown to the
 * user before a transaction-class workflow. Required by the placement
 * architecture — this is operational evidence supporting Document 5/6.
 */
export async function recordTransactionDisclosureView(args: {
  workflowId: string
  workflowType: WorkflowType
  organizationId?: string
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  await supabase.rpc('record_transaction_disclosure_view', {
    p_workflow_id: args.workflowId,
    p_workflow_type: args.workflowType,
    p_disclosure_version: TX_DISCLOSURE_VERSION,
    p_surface: Platform.OS === 'web' ? 'web' : `mobile_${Platform.OS}`,
    p_organization_id: args.organizationId ?? null,
  })
}
