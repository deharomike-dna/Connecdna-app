// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth } from '../../api/dna-client'
import { COLORS, S, SPACING, RADIUS } from '../../theme'

export default function LoginScreen({ navigation }: any) {
  const [apiKey, setApiKey] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [role, setRole] = useState<'provider' | 'patient'>('provider')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!apiKey.trim()) { Alert.alert('Error', 'API key required'); return }
    setLoading(true)
    try {
      // For patients: use wallet token flow
      // For providers: use API key + tenant slug
      await auth.saveSession(
        apiKey.trim(),
        tenantSlug.trim(),
        'user-id-placeholder',
        role === 'patient' ? 'patient' : 'md'
      )
      // Navigation handled by AppNavigator re-render
    } catch (err) {
      Alert.alert('Login failed', String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={S.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: SPACING.xl, justifyContent: 'center' }}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.xxl * 2 }}>
            <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
              <Text style={{ fontFamily: 'Courier', fontSize: 20, fontWeight: '700', color: '#0a0c10' }}>Dn</Text>
            </View>
            <Text style={{ fontFamily: 'Courier', fontSize: 22, fontWeight: '500', color: COLORS.text, letterSpacing: 1 }}>ConnecDNA</Text>
            <Text style={{ fontSize: 13, color: COLORS.text3, marginTop: 4 }}>Healthcare trust infrastructure</Text>
          </View>

          {/* Role selector */}
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }}>
            {(['provider', 'patient'] as const).map(r => (
              <TouchableOpacity key={r} onPress={() => setRole(r)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center',
                  backgroundColor: role === r ? COLORS.surface2 : 'transparent',
                  borderWidth: 1, borderColor: role === r ? COLORS.border2 : COLORS.border }}>
                <Text style={{ fontSize: 13, fontWeight: role === r ? '500' : '400', color: role === r ? COLORS.text : COLORS.text3 }}>
                  {r === 'provider' ? '⚕ Provider' : '🏥 Patient'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {role === 'provider' ? (
            <>
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={S.label}>Practice slug</Text>
                <TextInput style={S.input} placeholder="miami-medical-group" placeholderTextColor={COLORS.text3}
                  value={tenantSlug} onChangeText={setTenantSlug} autoCapitalize="none" autoCorrect={false} />
              </View>
              <View style={{ marginBottom: SPACING.lg }}>
                <Text style={S.label}>DNA API key</Text>
                <TextInput style={S.input} placeholder="dna_your_key_here" placeholderTextColor={COLORS.text3}
                  value={apiKey} onChangeText={setApiKey} autoCapitalize="none" autoCorrect={false} secureTextEntry />
              </View>
            </>
          ) : (
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={S.label}>Wallet token (from SMS link)</Text>
              <TextInput style={S.input} placeholder="Paste your wallet token" placeholderTextColor={COLORS.text3}
                value={apiKey} onChangeText={setApiKey} autoCapitalize="none" autoCorrect={false} />
              <Text style={{ fontSize: 11, color: COLORS.text3, marginTop: 6 }}>Open the link from your clinic's SMS to get your token</Text>
            </View>
          )}

          <TouchableOpacity style={[S.btnPrimary, { opacity: loading ? 0.6 : 1 }]} onPress={login} disabled={loading}>
            <Text style={S.btnPrimaryText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: 'center', marginTop: SPACING.lg }} onPress={() => navigation.navigate('Signup')}>
            <Text style={{ fontSize: 13, color: COLORS.blue }}>New practice? Start free trial →</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
