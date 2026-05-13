// src/screens/patient/PatientCareScreen.tsx
// Patient care — connected providers + pending information access requests
// from those providers (Approve / Deny each).

import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../../theme'

type Provider = {
  id: string
  name: string
  practice: string
  specialty: string
  initials: string
  connectedSince: string
}

type AccessRequest = {
  id: string
  fromName: string
  fromPractice: string
  scope: string // "Last 12 months of visit notes", etc.
  reason: string
  requestedAt: string
}

const PROVIDERS: Provider[] = [
  { id: '1', name: 'Dr. Michael Deharo', practice: 'Miami Medical Group',  specialty: 'Primary care · MD',     initials: 'MD', connectedSince: 'Jan 2026' },
  { id: '2', name: 'Dr. Priya Patel',    practice: 'Patel Imaging',        specialty: 'Radiology',             initials: 'PP', connectedSince: 'Mar 2026' },
  { id: '3', name: 'Dr. Carlos Vega',    practice: 'Vega Cardiology',      specialty: 'Cardiology',            initials: 'CV', connectedSince: 'Apr 2026' },
]

const REQUESTS: AccessRequest[] = [
  {
    id: 'r1',
    fromName: 'Dr. Carlos Vega',
    fromPractice: 'Vega Cardiology',
    scope: 'Last 12 months of visit notes',
    reason: 'Pre-procedure review for upcoming cardiac eval.',
    requestedAt: '2 hours ago',
  },
  {
    id: 'r2',
    fromName: 'Dr. Priya Patel',
    fromPractice: 'Patel Imaging',
    scope: 'Lab results from past 6 months',
    reason: 'Required for radiology contrast clearance.',
    requestedAt: 'Yesterday',
  },
]

export default function PatientCareScreen() {
  const [requests, setRequests] = useState(REQUESTS)
  const [providers] = useState(PROVIDERS)

  const pendingCount = requests.length
  const provCount = providers.length

  const respond = (id: string, action: 'approve' | 'deny') => {
    const req = requests.find((r) => r.id === id)
    if (!req) return
    Alert.alert(
      action === 'approve' ? 'Access granted' : 'Access denied',
      action === 'approve'
        ? `${req.fromName} can now access "${req.scope}".`
        : `${req.fromName}'s request was denied. They will be notified.`
    )
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Text style={S.pageTitle}>My care</Text>
        <Text style={S.pageSub}>
          {provCount} connected · {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending access requests */}
        {requests.length > 0 && (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={S.sectionTitle}>Information access requests</Text>
            {requests.map((r) => (
              <View key={r.id} style={[S.card, S.cardBlue]}>
                <Text style={styles.reqFrom}>{r.fromName}</Text>
                <Text style={styles.reqSub}>
                  {r.fromPractice} · {r.requestedAt}
                </Text>

                <View style={styles.reqDetailRow}>
                  <Text style={styles.reqKey}>Requesting</Text>
                  <Text style={styles.reqVal}>{r.scope}</Text>
                </View>
                <View style={styles.reqDetailRow}>
                  <Text style={styles.reqKey}>Reason</Text>
                  <Text style={styles.reqVal}>{r.reason}</Text>
                </View>

                <View style={styles.reqActions}>
                  <TouchableOpacity
                    style={styles.denyBtn}
                    onPress={() => respond(r.id, 'deny')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.denyBtnText}>Deny</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => respond(r.id, 'approve')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Connected providers */}
        <Text style={S.sectionTitle}>Your providers</Text>
        {providers.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.row}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert(
                p.name,
                `${p.specialty}\n${p.practice}\nConnected since ${p.connectedSince}`
              )
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{p.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.role}>
                {p.specialty} · {p.practice}
              </Text>
              <Text style={styles.since}>
                Connected since {p.connectedSince}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[S.btnSecondary, { marginTop: SPACING.md }]}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              'How to add a provider',
              'Ask your provider to send you an invite link via SMS or email. Tap the link on your phone to connect them automatically.'
            )
          }
        >
          <Text style={S.btnSecondaryText}>Add a provider via invite link</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  reqFrom: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  reqSub:  { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  reqDetailRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  reqKey: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text3,
    width: 80,
  },
  reqVal: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  reqActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  denyBtn: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border2,
    backgroundColor: COLORS.surface,
  },
  denyBtnText: { color: COLORS.text2, fontSize: 13, fontWeight: '800' },
  approveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.text,
    alignItems: 'center',
  },
  approveBtnText: { color: COLORS.bg, fontSize: 13, fontWeight: '800' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  role: { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  since: { fontSize: 11, color: COLORS.text3, marginTop: 2, fontStyle: 'italic' },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.text3,
    marginLeft: SPACING.sm,
  },
})
