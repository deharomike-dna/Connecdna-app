// src/api/dna-client.ts
// Centralized DNA API client for the React Native app.
// All screens use this — never raw fetch.
// Auth: DNA API key stored in expo-secure-store.
// Tenant ID resolved from user session.

import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.connecdna.com'

async function getHeaders(tenantId?: string): Promise<Record<string, string>> {
  const apiKey = await SecureStore.getItemAsync('dna_api_key')
  const storedTenantId = tenantId ?? await SecureStore.getItemAsync('dna_tenant_id')
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey ?? '',
    ...(storedTenantId ? { 'x-tenant-id': storedTenantId } : {}),
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getHeaders()
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...headers, ...(options?.headers ?? {}) } })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DNA API error ${res.status}: ${err}`)
  }
  return res.json()
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const auth = {
  async saveSession(apiKey: string, tenantId: string, userId: string, role: string) {
    await SecureStore.setItemAsync('dna_api_key', apiKey)
    await SecureStore.setItemAsync('dna_tenant_id', tenantId)
    await SecureStore.setItemAsync('dna_user_id', userId)
    await SecureStore.setItemAsync('dna_user_role', role)
  },
  async getSession() {
    const [apiKey, tenantId, userId, role] = await Promise.all([
      SecureStore.getItemAsync('dna_api_key'),
      SecureStore.getItemAsync('dna_tenant_id'),
      SecureStore.getItemAsync('dna_user_id'),
      SecureStore.getItemAsync('dna_user_role'),
    ])
    return { apiKey, tenantId, userId, role }
  },
  async clearSession() {
    await Promise.all([
      SecureStore.deleteItemAsync('dna_api_key'),
      SecureStore.deleteItemAsync('dna_tenant_id'),
      SecureStore.deleteItemAsync('dna_user_id'),
      SecureStore.deleteItemAsync('dna_user_role'),
    ])
  },
  async isAuthenticated(): Promise<boolean> {
    const key = await SecureStore.getItemAsync('dna_api_key')
    return !!key
  },
}

// ─── Provider dashboard ────────────────────────────────────────────────────

export const provider = {
  async getDashboard(locationId = 'all') {
    return request<ProviderDashboard>(`/api/provider/dashboard?locationId=${locationId}`)
  },
  async getClaims(locationId = 'all') {
    return request<ClaimBatch>(`/api/provider/claims/batch?locationId=${locationId}`)
  },
  async approveBatch(claimIds: string[]) {
    return request<{ ok: boolean }>('/api/provider/claims/approve', {
      method: 'POST',
      body: JSON.stringify({ claimIds }),
    })
  },
  async approveOne(claimId: string) {
    return request<{ ok: boolean }>('/api/provider/claims/approve', {
      method: 'POST',
      body: JSON.stringify({ claimIds: [claimId] }),
    })
  },
}

// ─── Signals ───────────────────────────────────────────────────────────────

export const signals = {
  async getAll(locationId?: string) {
    const q = locationId ? `?locationId=${locationId}` : ''
    return request<{ signals: Signal[] }>(`/api/signals${q}`)
  },
  async dismiss(signalId: string) {
    return request<{ ok: boolean }>(`/api/signals/${signalId}/dismiss`, { method: 'POST' })
  },
}

// ─── Notifications ─────────────────────────────────────────────────────────

export const notifications = {
  async get(recipientId: string, channel: 'browser' | 'wallet' | 'both' = 'both') {
    return request<NotificationResponse>(`/api/notifications?recipientId=${recipientId}&channel=${channel}`)
  },
  async markRead(notificationId: string, recipientId: string) {
    return request<{ ok: boolean }>('/api/notifications?action=read', {
      method: 'POST',
      body: JSON.stringify({ notificationId, recipientId }),
    })
  },
  async markAllRead(recipientId: string) {
    return request<{ ok: boolean }>('/api/notifications?action=read', {
      method: 'POST',
      body: JSON.stringify({ all: true, recipientId }),
    })
  },
}

// ─── Credentialing ─────────────────────────────────────────────────────────

export const credentialing = {
  async getStatus(providerId: string, providerType: string) {
    return request<CredentialCheckResult>(`/api/credentialing?providerId=${providerId}&providerType=${providerType}`)
  },
  async addCredential(data: AddCredentialInput) {
    return request<{ ok: boolean; credential: unknown }>('/api/credentialing', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  async verifyCredential(providerId: string, credentialType: string, credentialNumber?: string, state?: string) {
    return request<{ status: string; detail: string }>('/api/credentialing?action=verify', {
      method: 'POST',
      body: JSON.stringify({ providerId, credentialType, credentialNumber, state }),
    })
  },
}

// ─── Staff credentials ─────────────────────────────────────────────────────

export const staffCredentials = {
  async getHistory(staffId: string) {
    return request<{ checks: unknown[] }>(`/api/staff/credentials?staffId=${staffId}`)
  },
  async verifyIdentity(staffId: string, method: string, verifiedBy: string) {
    return request<{ ok: boolean }>('/api/staff/credentials?action=verify', {
      method: 'POST',
      body: JSON.stringify({ staffId, method, verifiedBy }),
    })
  },
}

// ─── Check-in ──────────────────────────────────────────────────────────────

export const checkin = {
  async lookup(data: CheckinLookupInput) {
    return request<CheckinLookupResult>('/api/checkin', {
      method: 'POST',
      headers: { 'x-checkin-action': 'lookup' },
      body: JSON.stringify(data),
    })
  },
  async send(data: CheckinSendInput) {
    return request<{ ok: boolean; pendingId: string; expiresAt: string }>('/api/checkin', {
      method: 'POST',
      headers: { 'x-checkin-action': 'send' },
      body: JSON.stringify(data),
    })
  },
  async verify(pendingId: string, code: string) {
    return request<{ ok: boolean; verified: boolean }>('/api/checkin', {
      method: 'POST',
      headers: { 'x-checkin-action': 'verify' },
      body: JSON.stringify({ pendingId, code }),
    })
  },
  async createSession(data: CheckinSessionInput) {
    return request<{ ok: boolean; palSessionId: string }>('/api/checkin', {
      method: 'POST',
      headers: { 'x-checkin-action': 'session' },
      body: JSON.stringify(data),
    })
  },
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export const admin = {
  async getUsers(tenantId: string) {
    return request<{ users: unknown[] }>(`/api/admin/users?tenantId=${tenantId}`)
  },
  async getLocations() {
    return request<{ locations: unknown[] }>('/api/admin/locations')
  },
  async getTenantStatus() {
    return request<{ tenant: unknown }>('/api/tenants')
  },
}

// ─── Patient wallet ────────────────────────────────────────────────────────

export const wallet = {
  async getSession(token: string) {
    return request<WalletSession>(`/api/wallet?token=${token}`)
  },
  async getInsurance(token: string) {
    return request<{ insurance: unknown }>(`/api/wallet?token=${token}&action=insurance`)
  },
  async getVisits(token: string) {
    return request<{ upcoming: unknown[]; past: unknown[] }>(`/api/wallet?token=${token}&action=visits`)
  },
  async getCode(token: string) {
    return request<{ code: string; secondsRemaining: number }>(`/api/wallet?token=${token}&action=code`)
  },
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProviderDashboard {
  provider: { name: string; role: string }
  summary: {
    claimsReady: number; protectedClaims: number
    requiresReview: number; notices: number
    monthlyRevenue: number; denialRiskPrevented: number
  }
  locationSummary: LocationSummary[]
}

export interface LocationSummary {
  locationId: string; locationName: string
  claimsReady: number; protectedClaims: number
  requiresReview: number; notices: number; riskStatus: string
}

export interface ClaimBatch {
  batchId: string; totalClaims: number; totalAmount: number
  protectedClaims: number; requiresReview: number
  claims: Claim[]
}

export interface Claim {
  claimId: string; locationName: string; patientInitials: string
  payer: string; amount: number; status: string
  eilDecision: string; signals: Signal[]
}

export interface Signal {
  category: string; severity: string; title: string
  message: string; recommendedAction: string
}

export interface NotificationResponse {
  notifications: Notification[]
  unreadCount: number; urgentCount: number
  bell: { hasUrgent: boolean; hasWarning: boolean; totalUnread: number }
}

export interface Notification {
  id: string; type: string; urgency: string
  title: string; body: string
  actionLabel?: string; actionUrl?: string
  read: boolean; createdAt: string
}

export interface CredentialCheckResult {
  providerId: string; providerType: string
  overallStatus: string; blockingIssues: string[]
  frictionIssues: string[]; noticeIssues: string[]
  completionPercent: number; readyForClaims: boolean
  credentials: unknown[]
}

export interface WalletSession {
  ok: boolean; session: unknown
  patient: { firstName: string; lastName?: string }
  visit: { provider: string; location: string; date: string }
  checkedIn: boolean
}

export interface AddCredentialInput {
  providerId: string; providerType: string; credentialType: string
  credentialNumber?: string; issuingState?: string
  expiryDate?: string; documentUrl?: string
}

export interface CheckinLookupInput {
  firstName: string; lastName: string; dob?: string
  memberId?: string; phone: string; providerId: string; locationId: string
}

export interface CheckinLookupResult {
  ok: boolean; patient: unknown; provider: unknown
  palAuthorized: boolean; canProceed: boolean
}

export interface CheckinSendInput {
  patientFirstName: string; patientPhone: string
  providerId: string; locationId: string; patientId?: string
}

export interface CheckinSessionInput {
  pendingId: string; providerId: string
  locationId: string; patientId?: string
}
