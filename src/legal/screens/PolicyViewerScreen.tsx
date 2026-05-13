// src/legal/screens/PolicyViewerScreen.tsx
//
// In-app policy viewer. Renders the bundled markdown body for a given slug
// in a scrolling view, shows version metadata at the top, and provides a
// safety "Open on web" button so users can always read the canonical version.

import React from 'react'
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { COLORS, RADIUS } from '../../theme'
import { POLICY_BODIES } from '../policyContent'
import { getEntry } from '../registry'
import { OPERATOR_ATTRIBUTION_LONG } from '../disclosures'
import type { LegalSlug } from '../types'

const WEBSITE_BASE_URL = process.env.EXPO_PUBLIC_WEBSITE_URL ?? 'https://connecdna.com'

interface Props {
  slug: LegalSlug
  onClose: () => void
}

export function PolicyViewerScreen({ slug, onClose }: Props) {
  const entry = getEntry(slug)
  const body = POLICY_BODIES[slug] ?? ''

  if (!entry) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Policy not found.</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnLabel}>Close</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Close policy viewer"
          hitSlop={8}
        >
          <Text style={styles.headerBtnLabel}>Close</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {entry.title}
        </Text>
        <Pressable
          onPress={() => Linking.openURL(`${WEBSITE_BASE_URL}${entry.webRoute}`)}
          style={styles.headerBtn}
          accessibilityRole="link"
          accessibilityLabel="Open on web"
          hitSlop={8}
        >
          <Text style={styles.headerBtnLabel}>Web ↗</Text>
        </Pressable>
      </View>

      <View style={styles.metaBar}>
        <Text style={styles.metaLabel}>{entry.category.toUpperCase()}</Text>
        <Text style={styles.metaText}>{OPERATOR_ATTRIBUTION_LONG}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Render markdown as plain monospaced-ish text to avoid pulling in a
            full markdown lib. The structure is already readable thanks to
            the consistent heading conventions in the source files. */}
        <Text style={styles.markdown}>{body}</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    backgroundColor: COLORS.surface,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  headerBtnLabel: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  metaBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    backgroundColor: COLORS.surface,
  },
  metaLabel: {
    color: COLORS.text3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  metaText: { color: COLORS.text2, fontSize: 11, marginTop: 2 },
  body: { padding: 18, paddingBottom: 48 },
  markdown: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  fallback: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackText: { color: COLORS.text, marginBottom: 16 },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.text,
  },
  closeBtnLabel: { color: COLORS.bg, fontWeight: '700' },
})
