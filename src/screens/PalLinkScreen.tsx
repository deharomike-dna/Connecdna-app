// src/screens/PalLinkScreen.tsx
// PAL Link generator. Worker enters patient phone/email, taps Generate,
// gets a one-time link + token. Shows live status (Pending → Patient
// consented → Worker wedge active). The worker-side wedge is a Chrome
// extension built as a separate project.

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'

type Stage = 'idle' | 'pending' | 'consented' | 'wedge_active' | 'expired'

type Props = {
  onBack?: () => void
}

const SCOPE_OPTIONS = [
  'Last 12 months of visit notes',
  'Lab results from past 6 months',
  'Imaging studies',
  'Prescription history',
  'Full chart access',
] as const

function statusMeta(s: Stage) {
  if (s === 'idle')         return { label: 'NOT GENERATED',  color: COLORS.text3, soft: COLORS.surface2 }
  if (s === 'pending')      return { label: 'PENDING',        color: COLORS.amber, soft: COLORS.amberSoft }
  if (s === 'consented')    return { label: 'PATIENT CONSENTED', color: COLORS.blue,  soft: COLORS.blueSoft }
  if (s === 'wedge_active') return { label: 'WEDGE ACTIVE',   color: COLORS.green, soft: COLORS.greenSoft }
  return                          { label: 'EXPIRED',        color: COLORS.red,   soft: COLORS.redSoft }
}

function genToken() {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 36).toString(36).toUpperCase()
  ).join('')
}

export default function PalLinkScreen({ onBack }: Props) {
  const [patientContact, setPatientContact] = useState('')
  const [scope, setScope] = useState<string>(SCOPE_OPTIONS[0])
  const [token, setToken] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('idle')

  // Stub: progress through stages over time so the user sees the lifecycle.
  useEffect(() => {
    if (stage !== 'pending') return
    const t1 = setTimeout(() => setStage('consented'), 4000)
    const t2 = setTimeout(() => setStage('wedge_active'), 7000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [stage])

  const generate = () => {
    if (!patientContact.trim()) {
      Alert.alert('Required', 'Enter a patient phone number or email.')
      return
    }
    setToken(genToken())
    setStage('pending')
  }

  const palLink = token
    ? `https://connecdna.app/pal/${token.toLowerCase()}`
    : ''

  const sharePal = async () => {
    if (!token) return
    try {
      await Share.share({
        message: `Your provider is requesting access to your records. Tap to consent: ${palLink}`,
      })
    } catch {}
  }

  const reset = () => {
    setToken(null)
    setStage('idle')
    setPatientContact('')
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={16}
            style={styles.backHit}
            activeOpacity={0.7}
          >
            <Text style={styles.back}>‹ Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backHit} />
        )}
        <Text style={styles.topTitle}>PAL Link</Text>
        <View style={styles.backHit} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          PAL (Permission Access Ledger) lets the patient consent to
          information sharing on their phone. Once consented, ConnecDNA&apos;s
          Chrome extension overlays a wedge in your active EMR window so you
          can view their records — regardless of what software the practice
          uses.
        </Text>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={S.label}>Patient mobile or email</Text>
          <TextInput
            style={S.input}
            placeholder="(305) 555-0142 or name@example.com"
            placeholderTextColor={COLORS.text3}
            value={patientContact}
            onChangeText={setPatientContact}
            autoCapitalize="none"
            editable={stage === 'idle'}
          />

          <Text style={[S.label, { marginTop: SPACING.md }]}>
            Scope requested
          </Text>
          <View style={styles.scopeWrap}>
            {SCOPE_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.scope, scope === s && styles.scopeActive]}
                onPress={() => setScope(s)}
                activeOpacity={0.85}
                disabled={stage !== 'idle'}
              >
                <Text
                  style={[
                    styles.scopeText,
                    scope === s && styles.scopeTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {stage === 'idle' && (
            <TouchableOpacity
              style={[S.btnPrimary, { marginTop: SPACING.lg }]}
              onPress={generate}
              activeOpacity={0.85}
            >
              <Text style={S.btnPrimaryText}>Generate PAL link</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live status */}
        {token && (
          <View style={styles.statusCard}>
            <View style={S.spaceBetween}>
              <Text style={styles.statusTitle}>PAL token</Text>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: statusMeta(stage).soft },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: statusMeta(stage).color },
                  ]}
                >
                  {statusMeta(stage).label}
                </Text>
              </View>
            </View>

            <Text style={styles.tokenText}>{token}</Text>
            <Text style={styles.linkText}>{palLink}</Text>

            {/* Stage timeline */}
            <View style={styles.timeline}>
              {(
                [
                  { k: 'pending',      label: 'Link sent · awaiting patient' },
                  { k: 'consented',    label: 'Patient consented' },
                  { k: 'wedge_active', label: 'Worker wedge active' },
                ] as const
              ).map((step, i) => {
                const reached =
                  (step.k === 'pending' && stage !== 'idle') ||
                  (step.k === 'consented' && (stage === 'consented' || stage === 'wedge_active')) ||
                  (step.k === 'wedge_active' && stage === 'wedge_active')
                return (
                  <View key={step.k} style={styles.timelineRow}>
                    <View
                      style={[
                        styles.timelineDot,
                        reached && styles.timelineDotActive,
                      ]}
                    >
                      {reached && <Text style={styles.timelineCheck}>✓</Text>}
                    </View>
                    <Text
                      style={[
                        styles.timelineLabel,
                        reached && { color: COLORS.text },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                )
              })}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[S.btnSecondary, { flex: 1 }]}
                onPress={sharePal}
                activeOpacity={0.85}
              >
                <Text style={S.btnSecondaryText}>Share link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.btnPrimary, { flex: 1 }]}
                onPress={reset}
                activeOpacity={0.85}
              >
                <Text style={S.btnPrimaryText}>New PAL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Wedge note */}
        <View style={styles.note}>
          <Text style={styles.noteTitle}>About the worker wedge</Text>
          <Text style={styles.noteBody}>
            The wedge is a separate Chrome extension installed on the worker&apos;s
            computer. Once the patient consents on their phone, the extension
            overlays patient information in the worker&apos;s active EMR window
            — no integration with the EMR is required. Install the extension
            from your administrator before using PAL.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: { color: COLORS.indigo, fontSize: 16, fontWeight: '700' },
  backHit: {
    minWidth: 80,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  topTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, flex: 1, textAlign: 'center' },

  intro: {
    fontSize: 13,
    color: COLORS.text2,
    lineHeight: 19,
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },

  scopeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  scope: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scopeActive: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.indigo,
  },
  scopeText: { fontSize: 11, fontWeight: '700', color: COLORS.text3 },
  scopeTextActive: { color: COLORS.text },

  statusCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border2,
    marginBottom: SPACING.lg,
  },
  statusTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  tokenText: {
    fontFamily: 'Courier',
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 4,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 11,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },

  timeline: {
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 6,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  timelineCheck: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  timelineLabel: {
    fontSize: 12,
    color: COLORS.text3,
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  note: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.blue,
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 12,
    color: COLORS.text2,
    lineHeight: 17,
  },
})
