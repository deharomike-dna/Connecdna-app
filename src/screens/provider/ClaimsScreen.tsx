// src/screens/provider/ClaimsScreen.tsx
import React, { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { provider, Claim } from '../../api/dna-client'
import { COLORS, S, SPACING } from '../../theme'

export default function ClaimsScreen() {
  const [batch, setBatch] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'review' | 'protected'>('all')

  const load = useCallback(async () => {
    const data = await provider.getClaims()
    setBatch(data)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = batch?.claims?.filter((c: Claim) =>
    filter === 'all' ? true :
    filter === 'review' ? (c.status === 'requires_review' || c.status === 'notice') :
    c.status === 'protected'
  ) ?? []

  const statusColor = (s: string) =>
    s === 'protected' ? COLORS.green :
    s === 'requires_review' ? COLORS.amber :
    s === 'blocked' ? COLORS.red : COLORS.blue

  const approveClaim = async (claimId: string) => {
    await provider.approveOne(claimId)
    Alert.alert('Approved', `Claim ${claimId} approved.`)
    load()
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Text style={S.pageTitle}>Claims</Text>
        <Text style={S.pageSub}>BATCH-{new Date().toISOString().split('T')[0].replace(/-/g,'')} · {batch?.totalClaims ?? 0} claims · ${batch?.totalAmount?.toLocaleString() ?? 0}</Text>
      </View>

      {/* Filter tabs */}
      <View style={{ flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        {(['all','protected','review'] as const).map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
              backgroundColor: filter === f ? COLORS.surface2 : 'transparent',
              borderWidth: 1, borderColor: filter === f ? COLORS.border2 : 'transparent' }}>
            <Text style={{ fontSize: 12, color: filter === f ? COLORS.text : COLORS.text3, fontWeight: filter === f ? '500' : '400' }}>
              {f === 'all' ? `All (${batch?.totalClaims ?? 0})` :
               f === 'protected' ? `Protected (${batch?.protectedClaims ?? 0})` :
               `Review (${batch?.requiresReview ?? 0})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: Claim) => item.claimId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={COLORS.green} />}
        contentContainerStyle={{ padding: SPACING.md }}
        renderItem={({ item }: { item: Claim }) => (
          <TouchableOpacity style={S.card} onPress={() => approveClaim(item.claimId)}>
            <View style={S.spaceBetween}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.text }}>{item.claimId} · {item.patientInitials}</Text>
                <Text style={{ fontSize: 11, color: COLORS.text3 }}>{item.locationName} · {item.payer}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'Courier', fontSize: 14, fontWeight: '600', color: COLORS.text }}>${item.amount.toLocaleString()}</Text>
                <View style={{ backgroundColor: statusColor(item.status) + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, marginTop: 2, borderWidth: 1, borderColor: statusColor(item.status) + '40' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: statusColor(item.status), fontFamily: 'Courier' }}>
                    {item.status === 'protected' ? 'PROTECTED' : item.status === 'requires_review' ? 'REVIEW' : item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            {item.signals?.length > 0 && (
              <View style={{ marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                {item.signals.slice(0,1).map((s, i) => (
                  <Text key={i} style={{ fontSize: 11, color: COLORS.text2 }}>⚡ {s.title}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}
