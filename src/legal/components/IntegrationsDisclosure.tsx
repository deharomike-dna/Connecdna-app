// src/legal/components/IntegrationsDisclosure.tsx
//
// Card rendered on the Settings → Integrations screen. Required by the
// placement architecture: discloses the use of Stripe, Plaid, Mercury,
// Airwallex, and other banking APIs and clarifies that ConneCDNA is not a
// bank or money transmitter.

import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, RADIUS } from '../../theme'
import { INTEGRATIONS_DISCLOSURE, OPERATOR_ATTRIBUTION_SHORT } from '../disclosures'

interface Props {
  /** Called when the user taps "Read full disclosure" — typically opens the api-data PolicyViewer. */
  onOpenFullDisclosure?: () => void
}

export function IntegrationsDisclosure({ onOpenFullDisclosure }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>THIRD-PARTY PROVIDERS</Text>
      <Text style={styles.body}>{INTEGRATIONS_DISCLOSURE}</Text>
      <Text style={styles.attribution}>{OPERATOR_ATTRIBUTION_SHORT}</Text>
      {onOpenFullDisclosure ? (
        <Pressable onPress={onOpenFullDisclosure} hitSlop={6}>
          <Text style={styles.link}>Read the API & Third-Party Connection Disclosure →</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  label: {
    color: COLORS.text3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  body: { color: COLORS.text, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  attribution: {
    color: COLORS.text3,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  link: { color: COLORS.indigo, fontSize: 12, fontWeight: '600' },
})
