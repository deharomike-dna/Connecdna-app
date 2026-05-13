// src/screens/ReportsScreen.tsx
// Per-organization / per-location report. Top-line "money saved" metric
// followed by acceptance / payment / expiration breakdowns. Export PDF
// stub at the bottom.

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
import { COLORS, S, SPACING, RADIUS } from '../theme'

type LocationReport = {
  id: string
  name: string
  claimsAccepted: number
  claimsTotal: number
  avgDaysToPayment: number
  expirationsAverted: number
  moneySaved: number // dollars
}

const LOCATIONS: LocationReport[] = [
  { id: 'all',  name: 'Miami Medical Group · all locations', claimsAccepted: 423, claimsTotal: 467, avgDaysToPayment: 14, expirationsAverted: 7,  moneySaved: 184_500 },
  { id: '1',    name: 'Miami Medical Group · main',          claimsAccepted: 248, claimsTotal: 270, avgDaysToPayment: 12, expirationsAverted: 4,  moneySaved: 102_300 },
  { id: '2',    name: 'Coral Gables Annex',                  claimsAccepted: 121, claimsTotal: 138, avgDaysToPayment: 17, expirationsAverted: 2,  moneySaved: 58_400 },
  { id: '3',    name: 'Brickell Telehealth',                 claimsAccepted: 54,  claimsTotal: 59,  avgDaysToPayment: 11, expirationsAverted: 1,  moneySaved: 23_800 },
]

const TIMEFRAMES = ['30 days', '90 days', 'YTD', 'All time'] as const
type Timeframe = (typeof TIMEFRAMES)[number]

type Props = {
  onBack?: () => void
}

export default function ReportsScreen({ onBack }: Props) {
  const [locationId, setLocationId] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<Timeframe>('YTD')

  const report = useMemo(
    () => LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0],
    [locationId]
  )

  const acceptedPct = Math.round(
    (report.claimsAccepted / report.claimsTotal) * 100
  )

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
        <Text style={styles.topTitle}>Reports</Text>
        <View style={styles.backHit} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Location picker */}
        <Text style={S.label}>Scope</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: SPACING.sm, paddingVertical: 4 }}
          style={{ marginBottom: SPACING.md }}
        >
          {LOCATIONS.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[
                styles.chip,
                locationId === l.id && styles.chipActive,
              ]}
              onPress={() => setLocationId(l.id)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.chipText,
                  locationId === l.id && styles.chipTextActive,
                ]}
              >
                {l.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timeframe pills */}
        <Text style={S.label}>Timeframe</Text>
        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.tfBtn,
                timeframe === tf && styles.tfBtnActive,
              ]}
              onPress={() => setTimeframe(tf)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tfText,
                  timeframe === tf && styles.tfTextActive,
                ]}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Headline metric — money saved */}
        <View style={styles.headlineCard}>
          <Text style={styles.headlineKicker}>MONEY SAVED USING CONNECDNA</Text>
          <Text style={styles.headlineValue}>
            ${report.moneySaved.toLocaleString()}
          </Text>
          <Text style={styles.headlineSub}>
            {timeframe} · {report.name}
          </Text>
          <Text style={styles.headlineFooter}>
            Calculated from prevented denials, on-time renewals, and
            expirations averted.
          </Text>
        </View>

        {/* Breakdown */}
        <Text style={S.sectionTitle}>Breakdown</Text>
        <View style={styles.statRow}>
          <StatTile
            label="Acceptance rate"
            value={`${acceptedPct}%`}
            sub={`${report.claimsAccepted} / ${report.claimsTotal} claims`}
            tint={COLORS.green}
          />
          <StatTile
            label="Avg days to payment"
            value={`${report.avgDaysToPayment}`}
            sub="industry avg 22"
            tint={COLORS.blue}
          />
        </View>

        <View style={[styles.statRow, { marginBottom: SPACING.lg }]}>
          <StatTile
            label="Expirations averted"
            value={`${report.expirationsAverted}`}
            sub="credentials renewed in time"
            tint={COLORS.amber}
          />
          <StatTile
            label="Total volume"
            value={`${report.claimsTotal}`}
            sub="claims processed"
            tint={COLORS.text}
          />
        </View>

        {/* Stacked monthly bar (visual only) */}
        <Text style={S.sectionTitle}>Trend</Text>
        <View style={styles.trendCard}>
          <View style={styles.bars}>
            {[28, 41, 39, 56, 62, 71, 68, 79].map((v, i) => (
              <View key={i} style={styles.barWrap}>
                <View style={[styles.bar, { height: v }]} />
                <Text style={styles.barLabel}>
                  {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i]}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.trendLegend}>
            Claims accepted per month · last 8 months
          </Text>
        </View>

        {/* Export */}
        <TouchableOpacity
          style={[S.btnSecondary, { marginTop: SPACING.lg }]}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              'Export PDF',
              `${timeframe} report for ${report.name} would be generated as a PDF and emailed to you.`
            )
          }
        >
          <Text style={S.btnSecondaryText}>Export PDF · email me a copy</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatTile({
  label,
  value,
  sub,
  tint,
}: {
  label: string
  value: string
  sub: string
  tint: string
}) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileVal, { color: tint }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </View>
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

  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.indigo,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: COLORS.text3 },
  chipTextActive: { color: COLORS.text },

  timeframeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tfBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tfBtnActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  tfText: { fontSize: 11, fontWeight: '700', color: COLORS.text3 },
  tfTextActive: { color: COLORS.bg },

  headlineCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border2,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headlineKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text3,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  headlineValue: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.green,
    letterSpacing: -1,
  },
  headlineSub: {
    fontSize: 12,
    color: COLORS.text2,
    fontWeight: '700',
    marginTop: 4,
  },
  headlineFooter: {
    fontSize: 11,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 15,
    paddingHorizontal: SPACING.md,
  },

  statRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  tileVal: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  tileLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  tileSub: { fontSize: 10, color: COLORS.text3, marginTop: 2 },

  trendCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 6,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bar: {
    width: '70%',
    backgroundColor: COLORS.indigo,
    borderRadius: 4,
  },
  barLabel: { fontSize: 9, color: COLORS.text3, fontWeight: '700' },
  trendLegend: {
    fontSize: 11,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
})
