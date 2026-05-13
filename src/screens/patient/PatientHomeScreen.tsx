// src/screens/patient/PatientHomeScreen.tsx
// Patient home — verified insurance card + coverage detail rows.

import React from 'react'
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

const COVERAGE = [
  { key: 'Plan',                value: 'Aetna PPO Plus' },
  { key: 'Member ID',           value: 'W123456789' },
  { key: 'Group',               value: '0876421-MMG' },
  { key: 'Effective',           value: '01 / 01 / 2026' },
  { key: 'Deductible',          value: '$1,500 individual' },
  { key: 'Met YTD',             value: '$420.00' },
  { key: 'Out-of-pocket max',   value: '$5,000' },
  { key: 'Office visit copay',  value: '$25 PCP · $40 Specialist' },
  { key: 'ER copay',            value: '$200 (waived if admitted)' },
  { key: 'Pharmacy',            value: 'Tier 1 $10 · Tier 2 $35' },
]

export default function PatientHomeScreen() {
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <View style={S.spaceBetween}>
          <View>
            <Text style={S.pageTitle}>My coverage</Text>
            <Text style={S.pageSub}>Verified · last sync today</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Share coverage',
                'A read-only link with your verified coverage will be sent.'
              )
            }
          >
            <Text style={styles.iconGlyph}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Insurance card */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>HEALTH INSURANCE · PPO</Text>
            <View style={styles.cardVerified}>
              <Text style={styles.cardVerifiedText}>VERIFIED</Text>
            </View>
          </View>

          <Text style={styles.cardName}>MICHAEL DEHARO</Text>
          <Text style={styles.cardMember}>W123456789</Text>

          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardKey}>GROUP</Text>
              <Text style={styles.cardValue}>0876421-MMG</Text>
            </View>
            <View>
              <Text style={styles.cardKey}>EFFECTIVE</Text>
              <Text style={styles.cardValue}>01 / 26</Text>
            </View>
            <View>
              <Text style={styles.cardKey}>RX BIN</Text>
              <Text style={styles.cardValue}>610502</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <ActionTile glyph="▤" label="Show card" />
          <ActionTile glyph="↗" label="Share" />
          <ActionTile glyph="✎" label="Update" />
          <ActionTile glyph="✓" label="Re-verify" />
        </View>

        <Text style={S.sectionTitle}>Coverage details</Text>
        <View style={styles.detailCard}>
          {COVERAGE.map((row, i) => (
            <View
              key={row.key}
              style={[
                styles.detailRow,
                i === COVERAGE.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.detailKey}>{row.key}</Text>
              <Text style={styles.detailVal}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>How verification works</Text>
          <Text style={styles.noteBody}>
            Your coverage details were retrieved from your payer at the time
            of last sync. ConnecDNA confirms the eligibility before any
            connected provider can submit a claim on your behalf.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function ActionTile({ glyph, label }: { glyph: string; label: string }) {
  return (
    <TouchableOpacity style={styles.actionTile} activeOpacity={0.85}>
      <View style={styles.actionIcon}>
        <Text style={styles.actionGlyph}>{glyph}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontSize: 18, color: COLORS.text2 },

  card: {
    backgroundColor: '#0f3a82',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    minHeight: 200,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.4,
  },
  cardVerified: {
    backgroundColor: 'rgba(34,197,94,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  cardVerifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#86efac',
    letterSpacing: 0.6,
  },
  cardName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: SPACING.lg,
  },
  cardMember: {
    fontFamily: 'Courier',
    color: 'rgba(255,255,255,0.92)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  cardKey: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.4,
  },

  actionsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionTile: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionGlyph: { fontSize: 18, color: COLORS.indigo },
  actionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text2 },

  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailKey: { fontSize: 12, color: COLORS.text3, fontWeight: '700' },
  detailVal: { fontSize: 13, color: COLORS.text, fontWeight: '700' },

  note: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
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
