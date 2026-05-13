// src/legal/screens/LegalCenterScreen.tsx
//
// Mobile-accessible Legal Center. Lists every public legal document the user
// might need post-signup. Tapping a row opens the PolicyViewer modal.
// This is required by the placement architecture for the mobile app.
//
// Wire into navigation: e.g. as a "Legal" item in MenuScreen / "More" tab.

import React, { useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { COLORS, RADIUS } from '../../theme'
import { LEGAL_REGISTRY } from '../registry'
import {
  NON_CUSTODIAL_SHORT_FORM,
  OPERATOR_ATTRIBUTION_SHORT,
  OPERATOR_ATTRIBUTION_LONG,
} from '../disclosures'
import { PolicyViewerScreen } from './PolicyViewerScreen'
import type { LegalCategory, LegalSlug } from '../types'

const CATEGORY_ORDER: LegalCategory[] = ['core', 'disclosure', 'framework']
const CATEGORY_TITLE: Record<LegalCategory, string> = {
  core: 'Core agreements',
  disclosure: 'Disclosures',
  framework: 'Frameworks',
}

export function LegalCenterScreen() {
  const [openSlug, setOpenSlug] = useState<LegalSlug | null>(null)

  const grouped = useMemo(() => {
    const out: Record<LegalCategory, typeof LEGAL_REGISTRY> = {
      core: [], disclosure: [], framework: [],
    } as any
    for (const e of LEGAL_REGISTRY) {
      // Hide internal docs from the user-facing center
      if (e.category === 'framework' && e.slug === 'transaction-flow-memo') continue
      out[e.category] = [...out[e.category], e]
    }
    return out
  }, [])

  return (
    <View style={styles.shell}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1}>Legal Center</Text>
        <Text style={styles.operatorLine}>{OPERATOR_ATTRIBUTION_SHORT}</Text>
        <Text style={styles.lede}>
          ConneCDNA operates as an affiliate platform entity under{' '}
          <Text style={styles.bold}>Silvermoon Capital LLC</Text>, which owns the
          underlying intellectual property, infrastructure, and platform rights.
          The documents below govern your use of the Platform.
        </Text>

        <View style={styles.disclosure}>
          <Text style={styles.disclosureLabel}>NON-CUSTODIAL</Text>
          <Text style={styles.disclosureBody}>{NON_CUSTODIAL_SHORT_FORM}</Text>
        </View>

        {CATEGORY_ORDER.map((cat) => {
          const list = grouped[cat]
          if (!list.length) return null
          return (
            <View key={cat} style={{ marginTop: 24 }}>
              <Text style={styles.sectionLabel}>{CATEGORY_TITLE[cat]}</Text>
              {list.map((d) => (
                <Pressable
                  key={d.slug}
                  onPress={() => setOpenSlug(d.slug)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${d.title}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{d.title}</Text>
                    <Text style={styles.rowDescr}>{d.shortDescription}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          )
        })}

        <Text style={styles.attribution}>
          {OPERATOR_ATTRIBUTION_LONG} ConneCDNA, the ConneCDNA logo, and related
          marks are trademarks of Silvermoon Capital LLC.
        </Text>
      </ScrollView>

      <Modal
        visible={openSlug !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpenSlug(null)}
      >
        {openSlug ? (
          <PolicyViewerScreen slug={openSlug} onClose={() => setOpenSlug(null)} />
        ) : null}
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20, paddingBottom: 60 },
  h1: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  operatorLine: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  lede: { color: COLORS.text2, fontSize: 13, lineHeight: 20, marginTop: 8 },
  bold: { color: COLORS.text, fontWeight: '700' },
  disclosure: {
    marginTop: 16,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  disclosureLabel: {
    color: COLORS.text3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  disclosureBody: { color: COLORS.text, fontSize: 12, lineHeight: 18 },
  sectionLabel: {
    color: COLORS.text3,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  rowPressed: { opacity: 0.7 },
  rowTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  rowDescr: { color: COLORS.text3, fontSize: 11, marginTop: 2, lineHeight: 16 },
  chevron: { color: COLORS.text3, fontSize: 22, marginLeft: 12 },
  attribution: {
    marginTop: 32,
    color: COLORS.text3,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
})
