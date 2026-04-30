// src/screens/provider/SignalsScreen.tsx
import React, { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { signals, Signal } from '../../api/dna-client'
import { COLORS, S, SPACING } from '../../theme'

export default function SignalsScreen() {
  const [data, setData] = useState<Signal[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const res = await signals.getAll()
    setData(res.signals ?? [])
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const catColor = (c: string) =>
    c === 'block' ? COLORS.red : c === 'friction' ? COLORS.amber :
    c === 'quarantine' ? COLORS.purple : COLORS.blue

  const dismiss = async (signalId: string) => {
    await signals.dismiss(signalId)
    load()
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Text style={S.pageTitle}>Signals</Text>
        <Text style={S.pageSub}>{data.length} active signals</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={COLORS.green} />}
        renderItem={({ item }: { item: any }) => {
          const color = catColor(item.category)
          return (
            <View style={[S.card, { borderLeftWidth: 3, borderLeftColor: color }]}>
              <View style={S.spaceBetween}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 }}>{item.title}</Text>
                <View style={{ backgroundColor: color + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: color + '40' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color, fontFamily: 'Courier' }}>{item.category?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: COLORS.text2, marginTop: 4, lineHeight: 18 }}>{item.message}</Text>
              <Text style={{ fontSize: 11, color: COLORS.text3, marginTop: 4, fontStyle: 'italic' }}>{item.recommendedAction}</Text>
              <View style={[S.row, { gap: SPACING.sm, marginTop: SPACING.sm }]}>
                <TouchableOpacity onPress={() => dismiss(item.id)} style={[S.btnSecondary, { flex: 1, paddingVertical: 8 }]}>
                  <Text style={[S.btnSecondaryText, { fontSize: 12 }]}>Dismiss</Text>
                </TouchableOpacity>
                {item.requiresUserAction && (
                  <TouchableOpacity style={{ flex: 2, backgroundColor: color + '20', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: color + '40' }}>
                    <Text style={{ fontSize: 12, fontWeight: '500', color }}>Review claim →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>✓</Text>
            <Text style={{ fontSize: 14, color: COLORS.text2 }}>No active signals</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

// src/screens/provider/CredentialingScreen.tsx
export function CredentialingScreen() {
  const [status, setStatus] = useState<any>(null)
  const load = useCallback(async () => {
    const session = await auth.getSession()
    if (session.userId) {
      const res = await credentialing.getStatus(session.userId, 'md')
      setStatus(res)
    }
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const pct = status?.completionPercent ?? 0
  const statusColor = pct === 100 ? COLORS.green : pct >= 70 ? COLORS.amber : COLORS.red

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Text style={S.pageTitle}>Credentials</Text>
        <Text style={S.pageSub}>Continuous credentialing — real-time</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {/* Completion ring */}
        <View style={[S.card, { alignItems: 'center', paddingVertical: SPACING.xl }]}>
          <Text style={{ fontFamily: 'Courier', fontSize: 48, fontWeight: '500', color: statusColor }}>{pct}%</Text>
          <Text style={{ fontSize: 13, color: COLORS.text2, marginTop: 4 }}>Credentialing complete</Text>
          <View style={{ marginTop: SPACING.md, flexDirection: 'row', gap: SPACING.lg }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Courier', fontSize: 20, color: COLORS.green }}>{status?.credentials?.filter((c: any) => c.status === 'verified').length ?? 0}</Text>
              <Text style={{ fontSize: 10, color: COLORS.text3 }}>Verified</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Courier', fontSize: 20, color: COLORS.amber }}>{status?.credentials?.filter((c: any) => c.status === 'pending' || c.status === 'manual_review').length ?? 0}</Text>
              <Text style={{ fontSize: 10, color: COLORS.text3 }}>Pending</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Courier', fontSize: 20, color: COLORS.red }}>{status?.credentials?.filter((c: any) => c.status === 'expired' || c.status === 'flagged').length ?? 0}</Text>
              <Text style={{ fontSize: 10, color: COLORS.text3 }}>Issues</Text>
            </View>
          </View>
        </View>

        {/* Blocking issues */}
        {status?.blockingIssues?.length > 0 && (
          <View style={{ marginBottom: SPACING.md }}>
            <Text style={S.sectionTitle}>Action required</Text>
            {status.blockingIssues.map((issue: string, i: number) => (
              <View key={i} style={[S.card, S.cardRed]}>
                <Text style={{ fontSize: 12, color: COLORS.red }}>⚠ {issue}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Credential list */}
        {status?.credentials?.map((cred: any, i: number) => {
          const color = cred.status === 'verified' ? COLORS.green : cred.status === 'expired' || cred.status === 'flagged' ? COLORS.red : COLORS.amber
          return (
            <View key={i} style={[S.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.text }}>{cred.credentialType?.replace(/_/g,' ')?.toUpperCase()}</Text>
                {cred.expiryDate && <Text style={{ fontSize: 11, color: COLORS.text3 }}>Expires {cred.expiryDate}</Text>}
              </View>
              <View style={{ backgroundColor: color + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: color + '40' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color, fontFamily: 'Courier' }}>{cred.status?.toUpperCase()}</Text>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

// src/screens/admin/AdminScreen.tsx
export function AdminScreen() {
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Text style={S.pageTitle}>Admin</Text>
        <Text style={S.pageSub}>Practice management</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {[
          { icon: '👥', label: 'Users & Roles', sub: 'Manage staff and providers' },
          { icon: '📍', label: 'Locations', sub: 'Clinics and facilities' },
          { icon: '🏥', label: 'EHR Connections', sub: 'Epic, Athena, eCW' },
          { icon: '💳', label: 'Billing', sub: 'Subscription and usage' },
          { icon: '📊', label: 'Reports', sub: 'Revenue and risk analytics' },
          { icon: '🔑', label: 'API Keys', sub: 'Manage integration keys' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={[S.card, { flexDirection: 'row', alignItems: 'center', gap: SPACING.md }]}>
            <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.text }}>{item.label}</Text>
              <Text style={{ fontSize: 12, color: COLORS.text3 }}>{item.sub}</Text>
            </View>
            <Text style={{ fontSize: 16, color: COLORS.text3 }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

// src/screens/patient/CheckinScreen.tsx
export function PatientCheckinScreen() {
  const [code, setCode] = useState<string | null>(null)
  const [checkedIn, setCheckedIn] = useState(false)
  const [entered, setEntered] = useState('')

  const keyPress = (k: string) => {
    if (k === '⌫') { setEntered(e => e.slice(0,-1)); return }
    if (entered.length >= 6) return
    setEntered(e => e + k)
  }

  const verify = () => {
    if (entered.length < 6) return
    setCheckedIn(true)
  }

  if (checkedIn) return (
    <SafeAreaView style={[S.screen, { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }]}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>✓</Text>
      <Text style={{ fontSize: 22, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Checked in</Text>
      <Text style={{ fontSize: 14, color: COLORS.text2, textAlign: 'center' }}>Dr. Michael Chen · Miami Clinic</Text>
      <TouchableOpacity style={[S.btnSecondary, { marginTop: SPACING.xl, width: '100%' }]} onPress={() => { setCheckedIn(false); setEntered('') }}>
        <Text style={S.btnSecondaryText}>New check-in</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Text style={S.pageTitle}>Check-in</Text>
        <Text style={S.pageSub}>Enter your 6-digit confirmation code</Text>
      </View>
      <View style={{ padding: SPACING.lg }}>
        {/* Code display */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.lg }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{
              width: 44, height: 54, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
              backgroundColor: COLORS.surface2, borderWidth: 1,
              borderColor: entered[i] ? COLORS.green : COLORS.border2,
            }}>
              <Text style={{ fontFamily: 'Courier', fontSize: 22, fontWeight: '500', color: entered[i] ? COLORS.green : COLORS.text3 }}>
                {entered[i] ?? ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Number pad */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <TouchableOpacity key={i} onPress={() => k && keyPress(k)}
              style={{
                width: '30%', height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: k ? COLORS.surface : 'transparent',
                borderWidth: k ? 1 : 0, borderColor: COLORS.border,
              }}>
              <Text style={{ fontSize: k === '⌫' ? 18 : 22, fontWeight: '500', color: k ? COLORS.text : 'transparent' }}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[S.btnPrimary, { opacity: entered.length < 6 ? 0.4 : 1 }]} onPress={verify} disabled={entered.length < 6}>
          <Text style={S.btnPrimaryText}>Confirm check-in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// src/screens/patient/InsuranceScreen.tsx
export function PatientInsuranceScreen() {
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Text style={S.pageTitle}>Insurance</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {/* Insurance card */}
        <View style={{ backgroundColor: '#1a2a4a', borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.blueBorder }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.blue, letterSpacing: 1, marginBottom: SPACING.md }}>BLUECROSS BLUESHIELD</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 2 }}>James Davidson</Text>
          <Text style={{ fontSize: 12, color: COLORS.text2 }}>Member ID: BCB-928471</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.md }}>
            {[{ label: 'Plan', val: 'PPO Gold' }, { label: 'Effective', val: '01/01/2026' }, { label: 'Copay', val: '$25' }].map((f, i) => (
              <View key={i}><Text style={{ fontSize: 9, color: COLORS.text3, marginBottom: 2 }}>{f.label}</Text><Text style={{ fontFamily: 'Courier', fontSize: 12, color: COLORS.text }}>{f.val}</Text></View>
            ))}
          </View>
        </View>
        {/* Coverage */}
        <Text style={S.sectionTitle}>Coverage</Text>
        <View style={S.card}>
          {[['Primary care','$25 copay'],['Specialist','$50 copay'],['Emergency','$250 copay'],['Deductible','$420 of $1,500'],['Out-of-pocket max','$6,000']].map(([k,v],i) => (
            <View key={i} style={[S.spaceBetween, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
              <Text style={{ fontSize: 12, color: COLORS.text2 }}>{k}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.text }}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={[S.card, S.cardGreen]}>
          <Text style={{ fontSize: 12, color: COLORS.green }}>✓ Coverage verified by ConnecDNA · OIG clear · Active</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// src/screens/patient/VisitsScreen.tsx
export function PatientVisitsScreen() {
  const visits = [
    { month:'APR', day:'28', title:'Follow-up · Dr. Chen', sub:'Miami Clinic · 10:30 AM', today: true },
    { month:'MAR', day:'15', title:'Annual physical · Dr. Chen', sub:'Miami Clinic · Completed', today: false },
    { month:'FEB', day:'3', title:'Cardiology consult', sub:'Miami Clinic · Completed', today: false },
  ]
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Visits</Text></View>
      <FlatList
        data={visits}
        keyExtractor={(_,i) => String(i)}
        contentContainerStyle={{ padding: SPACING.lg }}
        renderItem={({ item }) => (
          <View style={[S.card, item.today ? S.cardGreen : {}]}>
            <View style={S.row}>
              <View style={{ width: 44, alignItems: 'center', backgroundColor: COLORS.surface2, borderRadius: 8, padding: 6, marginRight: SPACING.md }}>
                <Text style={{ fontSize: 9, color: COLORS.text3, textTransform: 'uppercase' }}>{item.month}</Text>
                <Text style={{ fontFamily: 'Courier', fontSize: 18, fontWeight: '500', color: COLORS.text }}>{item.day}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.text }}>{item.title}</Text>
                <Text style={{ fontSize: 11, color: COLORS.text3, marginTop: 2 }}>{item.sub}</Text>
                {item.today && <View style={[S.badgeGreen, { alignSelf: 'flex-start', marginTop: 4 }]}><Text style={[S.badgeText, { color: COLORS.green }]}>TODAY</Text></View>}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

// src/screens/patient/ProfileScreen.tsx
export function PatientProfileScreen() {
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Profile</Text></View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
            <Text style={{ fontSize: 24, fontWeight: '600', color: 'white' }}>JD</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.text }}>James Davidson</Text>
          <Text style={{ fontSize: 12, color: COLORS.text3, marginTop: 4 }}>MRN: 00847291</Text>
          <View style={[S.badgeGreen, { marginTop: 8 }]}><Text style={[S.badgeText, { color: COLORS.green }]}>DNA VERIFIED</Text></View>
        </View>
        <View style={S.card}>
          {[['Email','j.davidson@email.com'],['Phone','+1 (305) 555-0182'],['Primary provider','Dr. Michael Chen'],['Location','Miami Clinic'],['DNA wallet','Active']].map(([k,v],i) => (
            <View key={i} style={[S.spaceBetween, { paddingVertical: 8, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: COLORS.border }]}>
              <Text style={{ fontSize: 12, color: COLORS.text2 }}>{k}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.text }}>{v}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[S.btnDanger, { marginTop: SPACING.sm }]}><Text style={S.btnDangerText}>Sign out</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

// Imports needed by screens above
import { auth } from '../../api/dna-client'
import { credentialing } from '../../api/dna-client'
import { ScrollView } from 'react-native'
import { useCallback } from 'react'
import { useState } from 'react'
