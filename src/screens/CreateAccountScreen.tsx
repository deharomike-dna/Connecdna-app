// src/screens/CreateAccountScreen.tsx
// Create account from an invite link. The token tells us who invited the
// user and what kind of relationship to create:
//   - Doctor invites NP / MA / Admin   → joins same practice (org member)
//   - Doctor invites another doctor    → workspace partnership (PAL)
//   - Doctor invites a patient         → patient connected to that doctor
//   - Friend invites another patient   → patient with social connection

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'

type InviteKind = 'org_member' | 'workspace_partner' | 'patient'

type InviteContext = {
  inviterName: string
  inviterRole: string // e.g. "Dr. M. Deharo · Miami Medical Group"
  kind: InviteKind
}

type Props = {
  token: string
  onAccountCreated?: (userType: 'org' | 'patient') => void
  onCancel?: () => void
}

// In production this would call /api/invite/lookup?token=...
// For now we infer from the token name to keep the UI flow real.
function lookupInvite(token: string): InviteContext {
  if (token.includes('patient')) {
    return {
      inviterName: 'Dr. Michael Deharo',
      inviterRole: 'Miami Medical Group',
      kind: 'patient',
    }
  }
  if (token.includes('partner')) {
    return {
      inviterName: 'Dr. Michael Deharo',
      inviterRole: 'Workspace partner · Miami Medical Group',
      kind: 'workspace_partner',
    }
  }
  return {
    inviterName: 'Dr. Michael Deharo',
    inviterRole: 'Miami Medical Group',
    kind: 'org_member',
  }
}

function kindLabel(k: InviteKind) {
  if (k === 'patient') return 'Patient invite'
  if (k === 'workspace_partner') return 'Workspace invite'
  return 'Team invite'
}

function kindHelper(k: InviteKind) {
  if (k === 'patient')
    return 'You will be connected as a patient. Your provider can request access to your records.'
  if (k === 'workspace_partner')
    return 'You will join as a workspace partner. You can share documents and message privately with the inviter.'
  return 'You will join the practice as a team member with the role assigned by the inviter.'
}

export default function CreateAccountScreen({
  token,
  onAccountCreated,
  onCancel,
}: Props) {
  const [ctx, setCtx] = useState<InviteContext | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCtx(lookupInvite(token))
  }, [token])

  const canSubmit =
    fullName.trim().length > 1 &&
    email.includes('@') &&
    password.length >= 8 &&
    password === confirmPassword &&
    agreeTerms

  const handleSubmit = () => {
    if (!canSubmit || !ctx) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onAccountCreated?.(ctx.kind === 'patient' ? 'patient' : 'org')
    }, 700)
  }

  if (!ctx) {
    return (
      <SafeAreaView style={S.screen}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Looking up invite…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={S.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.kindBadge}>{kindLabel(ctx.kind)}</Text>
          </View>

          {/* Inviter card */}
          <View style={styles.inviterCard}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.inviterLogo}
              resizeMode="contain"
            />
            <Text style={styles.inviterEyebrow}>Invited by</Text>
            <Text style={styles.inviterName}>{ctx.inviterName}</Text>
            <Text style={styles.inviterRole}>{ctx.inviterRole}</Text>
            <Text style={styles.inviterHelper}>{kindHelper(ctx.kind)}</Text>
          </View>

          {/* Account form */}
          <View style={styles.formCard}>
            <Text style={S.sectionTitle}>Create your account</Text>

            <View style={{ marginBottom: SPACING.md }}>
              <Text style={S.label}>Full name</Text>
              <TextInput
                style={S.input}
                placeholder="Jane Doe"
                placeholderTextColor={COLORS.text3}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={{ marginBottom: SPACING.md }}>
              <Text style={S.label}>Email</Text>
              <TextInput
                style={S.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.text3}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={{ marginBottom: SPACING.md }}>
              <Text style={S.label}>Phone (optional)</Text>
              <TextInput
                style={S.input}
                placeholder="(305) 555-0142"
                placeholderTextColor={COLORS.text3}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ marginBottom: SPACING.md }}>
              <Text style={S.label}>Password</Text>
              <TextInput
                style={S.input}
                placeholder="At least 8 characters"
                placeholderTextColor={COLORS.text3}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={{ marginBottom: SPACING.md }}>
              <Text style={S.label}>Confirm password</Text>
              <TextInput
                style={S.input}
                placeholder="Repeat your password"
                placeholderTextColor={COLORS.text3}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <Text style={styles.errText}>Passwords don&apos;t match</Text>
              )}
            </View>

            {/* Identity verification note (patient only) */}
            {ctx.kind === 'patient' && (
              <View style={styles.idCallout}>
                <Text style={styles.idCalloutTitle}>
                  Identity verification required
                </Text>
                <Text style={styles.idCalloutBody}>
                  After this step, you&apos;ll be asked to verify a government
                  ID. This is the minimum required to open a patient account.
                </Text>
              </View>
            )}

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              activeOpacity={0.7}
              onPress={() => setAgreeTerms((v) => !v)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreeTerms && styles.checkboxChecked,
                ]}
              >
                {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                S.btnPrimary,
                { opacity: canSubmit && !loading ? 1 : 0.5 },
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              <Text style={S.btnPrimaryText}>
                {loading
                  ? 'Creating account…'
                  : ctx.kind === 'patient'
                  ? 'Continue to ID verification'
                  : 'Create account'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.text2,
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cancelText: {
    color: COLORS.text2,
    fontSize: 14,
    fontWeight: '600',
  },
  kindBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.indigo,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  inviterCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border2,
    marginBottom: SPACING.lg,
  },
  inviterLogo: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  inviterEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inviterName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  inviterRole: {
    fontSize: 12,
    color: COLORS.text2,
    marginTop: 2,
  },
  inviterHelper: {
    fontSize: 12,
    color: COLORS.text2,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errText: {
    color: COLORS.red,
    fontSize: 11,
    marginTop: 4,
  },
  idCallout: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  idCalloutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.blue,
    marginBottom: 4,
  },
  idCalloutBody: {
    fontSize: 12,
    color: COLORS.text2,
    lineHeight: 17,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.indigo,
    borderColor: COLORS.indigo,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text2,
    lineHeight: 17,
  },
  termsLink: {
    color: COLORS.indigo,
    fontWeight: '700',
  },
})
