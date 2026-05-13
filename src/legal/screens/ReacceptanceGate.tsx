// src/legal/screens/ReacceptanceGate.tsx
//
// Force re-acceptance gate. Mount this above the main app navigator so any
// user with an uncleared row in policy_review_required_users is presented
// with a blocking modal until they re-accept the updated policies.
//
// Usage:
//   <ReacceptanceGate>{<AppNavigator />}</ReacceptanceGate>

import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { COLORS, RADIUS } from '../../theme'
import {
  getPendingReacceptanceSlugs,
  recordAcceptanceBundle,
} from '../acceptanceService'
import { getEntry } from '../registry'
import type { LegalSlug } from '../types'
import { PolicyViewerScreen } from './PolicyViewerScreen'

interface Props {
  children: React.ReactNode
}

export function ReacceptanceGate({ children }: Props) {
  const [pending, setPending] = useState<LegalSlug[] | null>(null)
  const [accepted, setAccepted] = useState<Set<LegalSlug>>(new Set())
  const [openSlug, setOpenSlug] = useState<LegalSlug | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    const slugs = await getPendingReacceptanceSlugs()
    setPending(slugs)
    setAccepted(new Set())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (pending === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.indigo} />
      </View>
    )
  }

  if (pending.length === 0) {
    return <>{children}</>
  }

  const allChecked = pending.every((s) => accepted.has(s))

  const onConfirm = async () => {
    setSubmitting(true)
    const r = await recordAcceptanceBundle(pending, 'reacceptance')
    setSubmitting(false)
    if (r.failed.length === 0) {
      await refresh()
    }
  }

  return (
    <View style={styles.shell}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>UPDATED POLICIES</Text>
        <Text style={styles.title}>We've updated our legal framework.</Text>
        <Text style={styles.lede}>
          Please review and re-accept the updated documents below to continue using
          ConneCDNA. Your previous acceptance records remain in your audit trail.
        </Text>

        {pending.map((slug) => {
          const entry = getEntry(slug)
          if (!entry) return null
          const isOn = accepted.has(slug)
          return (
            <View key={slug} style={styles.row}>
              <Pressable
                onPress={() => {
                  const next = new Set(accepted)
                  if (isOn) next.delete(slug)
                  else next.add(slug)
                  setAccepted(next)
                }}
                style={[styles.box, isOn && styles.boxOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isOn }}
              >
                {isOn ? <Text style={styles.tick}>✓</Text> : null}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Pressable onPress={() => setOpenSlug(slug)} hitSlop={6}>
                  <Text style={styles.rowTitle}>
                    I have reviewed the updated{' '}
                    <Text style={styles.link}>{entry.title}</Text>.
                  </Text>
                </Pressable>
                <Text style={styles.rowDescr}>{entry.shortDescription}</Text>
              </View>
            </View>
          )
        })}

        <Pressable
          disabled={!allChecked || submitting}
          onPress={onConfirm}
          style={[
            styles.cta,
            (!allChecked || submitting) && styles.ctaDisabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !allChecked || submitting }}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={styles.ctaLabel}>Confirm acceptance</Text>
          )}
        </Pressable>
      </ScrollView>

      {openSlug ? (
        <View style={StyleSheet.absoluteFill}>
          <PolicyViewerScreen slug={openSlug} onClose={() => setOpenSlug(null)} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.bg },
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg,
  },
  body: { padding: 24, paddingTop: 56 },
  label: {
    color: COLORS.text3,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  lede: { color: COLORS.text2, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  box: {
    width: 22, height: 22, borderRadius: RADIUS.sm,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bg, marginRight: 12, marginTop: 2,
  },
  boxOn: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  tick: { color: COLORS.bg, fontSize: 14, fontWeight: '800' },
  rowTitle: { color: COLORS.text, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  link: { textDecorationLine: 'underline' },
  rowDescr: { color: COLORS.text3, fontSize: 11, marginTop: 2, lineHeight: 16 },
  cta: {
    marginTop: 24,
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaLabel: { color: COLORS.bg, fontSize: 14, fontWeight: '700' },
})
