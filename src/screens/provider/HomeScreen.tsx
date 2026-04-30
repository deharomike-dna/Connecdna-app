// src/screens/provider/HomeScreen.tsx
// Provider home — summary stats, batch approve, signal preview, notifications.

import React, { useCallback, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { provider, notifications, auth } from '../../api/dna-client'
import { COLORS, S, SPACING, RADIUS } from '../../theme'

export default function ProviderHomeScreen() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [notifData, setNotifData] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const session = await auth.getSession()
    setUserId(session.userId)
    const [dash, notifs] = await Promise.all([
      provider.getDashboard(),
      session.userId ? notifications.get(session.userId, 'both') : null,
    ])
    setDashboard(dash)
    setNotifData(notifs)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const approveBatch = async () => {
    Alert.alert(
      'Approve Protected Claims',
      `Approve all ${dashboard?.summary?.protectedClaims} protected claims?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve', style: 'default',
          onPress: async () => {
            await provider.approveBatch([])
            Alert.alert('Done', 'Protected claims approved.')
            load()
          },
        },
      ]
    )
  }

  const now = new Date()
  const hhmm = `${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}`

  const urgentCount = notifData?.urgentCount ?? 0
  const sum = dashboard?.summary

  return (
    <SafeAreaView style={S.screen}>
      {/* Header */}
      <View style={S.header}>
        <View style={S.spaceBetween}>
          <View>
            <Text style={S.pageTitle}>Good morning, {dashboard?.provider?.name?.split(' ')[0] ?? 'Doctor'}</Text>
            <Text style={S.pageSub}>{hhmm} UTC · {dashboard?.locationSummary?.[0]?.locationName ?? 'All locations'}</Text>
          </View>
          <View style={{ position: 'relative' }}>
            <View style={styles.bellBtn}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              {urgentCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{urgentCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
      >
        {/* Stats */}
        <View style={S.statGrid}>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: COLORS.green }]}>{sum?.protectedClaims ?? '—'}</Text>
            <Text style={S.statLbl}>Protected</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: COLORS.amber }]}>{sum?.requiresReview ?? '—'}</Text>
            <Text style={S.statLbl}>Needs review</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: COLORS.text }]}>${sum ? Math.round(sum.monthlyRevenue / 1000) : '—'}K</Text>
            <Text style={S.statLbl}>Monthly rev</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: COLORS.green }]}>${sum ? Math.round(sum.denialRiskPrevented / 1000) : '—'}K</Text>
            <Text style={S.statLbl}>Risk prevented</Text>
          </View>
        </View>

        {/* Batch approve */}
        <TouchableOpacity style={[S.btnPrimary, { marginBottom: SPACING.md }]} onPress={approveBatch}>
          <Text style={S.btnPrimaryText}>Approve Protected Claims ({sum?.protectedClaims ?? 0})</Text>
        </TouchableOpacity>

        {/* Urgent notifications */}
        {urgentCount > 0 && (
          <View style={{ marginBottom: SPACING.md }}>
            <Text style={S.sectionTitle}>Urgent alerts</Text>
            {notifData?.notifications?.filter((n: any) => n.urgency === 'urgent' && !n.read).slice(0, 3).map((n: any) => (
              <TouchableOpacity key={n.id} style={[S.card, S.cardRed]}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.red, marginBottom: 3 }}>{n.title}</Text>
                <Text style={{ fontSize: 11, color: COLORS.text2 }}>{n.body}</Text>
                {n.actionLabel && (
                  <Text style={{ fontSize: 11, color: COLORS.red, marginTop: 6, fontWeight: '500' }}>{n.actionLabel} →</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Location summary */}
        {dashboard?.locationSummary && (
          <View style={{ marginBottom: SPACING.md }}>
            <Text style={S.sectionTitle}>Locations</Text>
            {dashboard.locationSummary.map((loc: any) => (
              <View key={loc.locationId} style={[S.card, loc.riskStatus === 'notice' ? S.cardAmber : S.cardGreen]}>
                <View style={S.spaceBetween}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.text }}>{loc.locationName}</Text>
                  <View style={loc.riskStatus === 'notice' ? S.badgeAmber : S.badgeGreen}>
                    <Text style={[S.badgeText, { color: loc.riskStatus === 'notice' ? COLORS.amber : COLORS.green }]}>
                      {loc.riskStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={[S.row, { marginTop: SPACING.sm, gap: SPACING.lg }]}>
                  <View>
                    <Text style={[S.statVal, { fontSize: 16, color: COLORS.green }]}>{loc.protectedClaims}</Text>
                    <Text style={S.statLbl}>Protected</Text>
                  </View>
                  <View>
                    <Text style={[S.statVal, { fontSize: 16, color: COLORS.amber }]}>{loc.requiresReview}</Text>
                    <Text style={S.statLbl}>Review</Text>
                  </View>
                  <View>
                    <Text style={[S.statVal, { fontSize: 16, color: COLORS.blue }]}>{loc.notices}</Text>
                    <Text style={S.statLbl}>Notices</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  bellBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.red, borderRadius: RADIUS.full,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '700', color: 'white' },
})
