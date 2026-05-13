// src/api/client.ts
// Mobile → backend API client. All network calls in the app go through
// this module so route paths, auth header injection, retry, and error
// handling live in one place.
//
// Backend lives in ~/dna-healthcare. ROUTES below match the actual paths
// in app/api/. If your backend changes a path or body shape, ONLY touch
// the ROUTES + adapter functions below.

import { supabase, getAccessToken } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — edit here to match your backend
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ??
  'https://www.connecdna.com'

export const ROUTES = {
  // Phone OTP — verified against ~/dna-healthcare/app/api/auth/
  smsSend:    '/api/auth/send-phone-verification',
  smsVerify:  '/api/auth/verify-phone',

  // Invitations — verified against ~/dna-healthcare/app/api/helpers/send-invite
  invitesCreate: '/api/helpers/send-invite',

  // Claims (TODO: confirm exact paths in dna-healthcare)
  claimsApprove:    '/api/claims/approve',
  claimsApproveOne: '/api/claims/approve-one',

  // Credentials (TODO: confirm)
  credentialReminder: '/api/credentials/reminder',
  credentialRenew:    '/api/credentials/renew',

  // PAL (TODO: confirm)
  palCreate: '/api/pal/create',
  palStatus: '/api/pal/status',

  // Bank (Plaid) (TODO: confirm)
  plaidLinkToken: '/api/plaid/link-token',
  plaidExchange:  '/api/plaid/exchange',

  // Uploads (TODO: see BACKEND_TODO.md)
  uploads: '/api/uploads',

  // Audit (TODO: confirm)
  auditLog: '/api/audit',

  // Verified Employment & Credential Network — document intelligence.
  // Backend: ~/dna-healthcare/app/api/employment-credential/intelligence/analyze
  // Authed via Supabase session JWT (Bearer); see request() below.
  vecAnalyzeDocument: '/api/employment-credential/intelligence/analyze',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ApiError = {
  status: number
  message: string
  code?: string
  raw?: unknown
}

// ─────────────────────────────────────────────────────────────────────────────
// Low-level fetch wrapper with auth, retry, backoff
// ─────────────────────────────────────────────────────────────────────────────

const RETRY_STATUSES = new Set([0, 408, 429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 3

function jitter(baseMs: number): number {
  return Math.round(baseMs * (0.5 + Math.random()))
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = init
  const url = `${BASE_URL}${path}`

  // Inject Supabase access token (if authed call and we have a session)
  let authHeader: Record<string, string> = {}
  if (auth) {
    const token = await getAccessToken()
    if (token) authHeader = { Authorization: `Bearer ${token}` }
  }

  const buildHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Info': 'connecdna-mobile',
    ...authHeader,
    ...(headers ?? {}),
  })

  let lastError: ApiError | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response
    try {
      res = await fetch(url, { ...rest, headers: buildHeaders() })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network request failed'
      lastError = {
        status: 0,
        message: `Cannot reach ${BASE_URL}. ${message}`,
      }
      // Retry transient network errors with backoff
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, jitter(300 * attempt)))
        continue
      }
      throw lastError
    }

    let body: unknown = null
    const text = await res.text()
    if (text) {
      try { body = JSON.parse(text) } catch { body = text }
    }

    if (res.ok) {
      return body as T
    }

    // 401 → try once to refresh the Supabase session, then retry
    if (res.status === 401 && auth && attempt === 1) {
      const refreshed = await supabase.auth.refreshSession()
      if (refreshed.data.session) {
        const newToken = refreshed.data.session.access_token
        authHeader = { Authorization: `Bearer ${newToken}` }
        continue // retry with fresh token
      }
    }

    const message =
      (body && typeof body === 'object' && 'message' in body && typeof (body as { message: unknown }).message === 'string')
        ? (body as { message: string }).message
        : (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string')
        ? (body as { error: string }).error
        : `Request failed (${res.status})`
    const code =
      (body && typeof body === 'object' && 'code' in body && typeof (body as { code: unknown }).code === 'string')
        ? (body as { code: string }).code
        : undefined
    lastError = { status: res.status, message, code, raw: body }

    // Retry transient server errors
    if (RETRY_STATUSES.has(res.status) && attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, jitter(300 * attempt)))
      continue
    }
    throw lastError
  }

  // Should be unreachable, but TS wants a return path
  throw lastError ?? <ApiError>{ status: 0, message: 'Unknown error' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export const api = {
  // ─── Auth: phone verification ────────────────────────────────────────────

  /** Request a 6-digit code be sent to the given phone number. */
  sendSmsOtp(phone: string) {
    return request<{ success?: boolean; sent?: boolean }>(
      ROUTES.smsSend,
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }
    )
  },

  /** Verify a 6-digit code for a given phone. */
  verifySmsOtp(phone: string, code: string) {
    return request<{ success?: boolean; verified?: boolean }>(
      ROUTES.smsVerify,
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      }
    )
  },

  /**
   * Change the user's phone. Calls send → verify in two steps.
   * Returns once the code is verified and the phone is saved.
   */
  async changePhone(newPhone: string, verifiedCode: string) {
    // Both steps are auth-protected and update the user's profile server-side.
    return api.verifySmsOtp(newPhone, verifiedCode)
  },

  // ─── Invitations ─────────────────────────────────────────────────────────

  /**
   * Send an invite via SMS or email. Backend route is
   * /api/helpers/send-invite which expects helper_* keys.
   */
  sendInvite(args: {
    helperName: string
    helperPhone?: string
    helperEmail?: string
    helperRole: string
    permissionLevel?: string
  }) {
    return request<{
      success: boolean
      message?: string
      inviteToken?: string
      smsMessageId?: string
    }>(ROUTES.invitesCreate, {
      method: 'POST',
      body: JSON.stringify({
        helperName:      args.helperName,
        helperPhone:     args.helperPhone,
        helperEmail:     args.helperEmail,
        helperRole:      args.helperRole,
        permissionLevel: args.permissionLevel ?? 'standard',
      }),
    })
  },

  // ─── Audit (best-effort, never throws) ───────────────────────────────────

  async logAudit(event: string, payload: Record<string, unknown> = {}) {
    try {
      await request(ROUTES.auditLog, {
        method: 'POST',
        body: JSON.stringify({
          event,
          payload,
          ts: new Date().toISOString(),
        }),
      })
    } catch {
      // Never break user flows on audit failure.
    }
  },

  // ─── VEC Document Intelligence ───────────────────────────────────────────
  //
  // Mobile and web call this identical endpoint with the same payload
  // shape. The backend orchestrates Claude analysis, runs engine-side
  // anomaly checks (hash reuse, identity inconsistency), persists a
  // claude_analysis evidence row, and returns the merged analysis.
  //
  // Pre-conditions on the mobile side:
  //   1. The document file must already exist in the Supabase
  //      `identity-documents` bucket at <userId>/vec-evidence/...
  //   2. You must have the SHA-256 hash of the original bytes (used
  //      both for tamper evidence and for cross-profile reuse checks).
  //   3. claim is the record being verified — fetch it with the
  //      anon-key supabase client just before calling this.

  async vecAnalyzeDocument(args: {
    profileId: string
    recordType: 'employment' | 'education' | 'credential' | 'reference' | 'affiliation' | 'identity'
    recordId: string
    documentStoragePath: string
    documentMimeType: string
    documentHashSha256: string
    claim: Record<string, unknown>
  }): Promise<{ analysis: VecAnalysis; evidenceId: string }> {
    return request<{ analysis: VecAnalysis; evidenceId: string }>(
      ROUTES.vecAnalyzeDocument,
      {
        method: 'POST',
        body: JSON.stringify(args),
      },
    )
  },
}

// Mirror of the AnalysisOutcome shape from
// ~/dna-healthcare/lib/employment-credential/intelligence/types.ts.
// Kept narrowly typed here so mobile UI can render without re-importing
// the web app's lib. Treat the web types as the source of truth — if
// you add a field there, mirror it here.
export type VecAnalysis = {
  detected_document_type: string
  extracted_fields: Record<string, string | number | null>
  issuer_hints: {
    payroll_vendor: string | null
    hris_vendor: string | null
    detected_confidence: number
  }
  cross_validation: {
    claim_match_score: number
    mismatches: { field: string; claimed: string; observed: string; severity: 'low' | 'medium' | 'high' | 'critical' }[]
    agreements: string[]
  }
  anomalies: { kind: string; severity: 'low' | 'medium' | 'high' | 'critical'; reason: string }[]
  recommended_sources: { adapter_kind: string; vendor: string | null; reason: string }[]
  confidence_delta: number
  reasoning: string[]
  model_version: string
  prompt_version: string
  generated_at: string
}

export { BASE_URL }
