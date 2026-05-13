// src/legal/components/PolicyCheckboxBundle.tsx
//
// Acceptance UI used by the registration / onboarding flow.
// Renders one checkbox per required document with a tappable hyperlink that
// opens the PolicyViewer for that document. Parent owns the accepted-state
// (so the parent can decide when "Create account" becomes enabled).
//
// Required slugs come from REQUIRED_AT_SIGNUP in the registry, so removing or
// adding a required doc upstream automatically changes this UI.

import React from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { COLORS, RADIUS } from '../../theme'
import { REQUIRED_AT_SIGNUP } from '../registry'
import { SIGNUP_ACCEPTANCE_LINE } from '../disclosures'
import type { LegalSlug } from '../types'

interface Props {
  /** Slugs the user has currently checked. */
  accepted: ReadonlySet<LegalSlug>
  /** Toggle a single slug's checked state. */
  onToggle: (slug: LegalSlug) => void
  /** Open the PolicyViewer for the given slug. */
  onOpen: (slug: LegalSlug) => void
}

export function PolicyCheckboxBundle({ accepted, onToggle, onOpen }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.lead}>{SIGNUP_ACCEPTANCE_LINE}</Text>
      {REQUIRED_AT_SIGNUP.map((d) => {
        const isAccepted = accepted.has(d.slug)
        return (
          <View key={d.slug} style={styles.row}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAccepted }}
              accessibilityLabel={`Accept ${d.title}`}
              hitSlop={8}
              onPress={() => onToggle(d.slug)}
              style={[styles.box, isAccepted && styles.boxOn]}
            >
              {isAccepted ? <Text style={styles.tick}>✓</Text> : null}
            </Pressable>
            <View style={styles.copy}>
              <Pressable onPress={() => onOpen(d.slug)} hitSlop={6}>
                <Text style={styles.title}>
                  I agree to the <Text style={styles.link}>{d.title}</Text>
                </Text>
              </Pressable>
              <Text style={styles.descr}>{d.shortDescription}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

/** Convenience helper for parents — true once every required slug is checked. */
export function allRequiredAccepted(accepted: ReadonlySet<LegalSlug>): boolean {
  return REQUIRED_AT_SIGNUP.every((d) => accepted.has(d.slug))
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 4, paddingTop: 4 },
  lead: {
    color: COLORS.text2,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginRight: 12,
    marginTop: 2,
  },
  boxOn: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  tick: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 14,
  },
  copy: { flex: 1 },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
    color: COLORS.text,
  },
  descr: {
    color: COLORS.text3,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
})
