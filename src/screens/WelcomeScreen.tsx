// src/screens/WelcomeScreen.tsx
// ConnecDNA single sign-in. Username + password. No role toggle, no slug,
// no token. New accounts are reached via emailed/SMS invite links only.

import React, { useState } from 'react'
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
  Alert,
  Modal,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'
import { api } from '../api/client'
import { supabase } from '../lib/supabase'

type Props = {
  onSignIn?: (email: string) => void
  onOpenInviteToken?: (token: string) => void
}

export default function WelcomeScreen({ onSignIn, onOpenInviteToken }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  // Change-number recovery flow — simplified two-step:
  // 1) enter new number → SMS code via Twilio
  // 2) enter code → number reset, can sign in
  const [changeOpen, setChangeOpen] = useState(false)
  const [changeStep, setChangeStep] = useState<'enter_new' | 'verify_new'>('enter_new')
  const [changeNewPhone, setChangeNewPhone] = useState('')
  const [changeNewCode, setChangeNewCode] = useState('')
  const [changeBusy, setChangeBusy] = useState(false)
  const [changeError, setChangeError] = useState<string | null>(null)

  const startChange = () => {
    setChangeStep('enter_new')
    setChangeNewPhone('')
    setChangeNewCode('')
    setChangeError(null)
    setChangeOpen(true)
  }

  const sendChangeCode = async () => {
    setChangeError(null)
    setChangeBusy(true)
    try {
      await api.sendSmsOtp(changeNewPhone.trim())
      setChangeStep('verify_new')
    } catch (e) {
      const err = e as { message?: string }
      setChangeError(err.message ?? 'Could not send code. Try again.')
    } finally {
      setChangeBusy(false)
    }
  }

  const finishChange = async () => {
    setChangeError(null)
    setChangeBusy(true)
    try {
      await api.changePhone(changeNewPhone.trim(), changeNewCode.trim())
      setChangeOpen(false)
      Alert.alert(
        'Phone updated',
        `Your number was reset to ${changeNewPhone}. Sign in with your username and the new number.`
      )
    } catch (e) {
      const err = e as { message?: string }
      setChangeError(err.message ?? 'Could not verify code. Try again.')
    } finally {
      setChangeBusy(false)
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0

  const handleSignIn = async () => {
    if (!canSubmit) return
    setSignInError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        setSignInError(error.message)
        return
      }
      // Audit (fire-and-forget)
      api.logAudit('signin.completed', { email: email.trim() })
      onSignIn?.(email.trim())
    } catch (e) {
      const err = e as { message?: string }
      setSignInError(err.message ?? 'Sign in failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = () => {
    Alert.alert(
      'Reset password',
      'A reset link will be sent to the email or phone on file.'
    )
  }

  // Dev-only: simulate opening an invite link to test the CreateAccount flow.
  // In production, deep links carry the token directly into the app.
  const handleSimulateInvite = () => {
    onOpenInviteToken?.('demo_invite_token_provider')
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
          {/* Hero */}
          <View style={styles.hero}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>Welcome!</Text>
            <Text style={styles.heroKicker}>ConnecDNA</Text>
            <Text style={styles.heroSub}>Trusted Verified Layer</Text>
          </View>

          {/* Sign-in form */}
          <View style={styles.formCard}>
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={S.label}>Email</Text>
              <TextInput
                style={S.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.text3}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
              />
            </View>

            <View style={{ marginBottom: SPACING.md }}>
              <Text style={S.label}>Password</Text>
              <TextInput
                style={S.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.text3}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                secureTextEntry
              />
            </View>

            {signInError && (
              <Text style={styles.errorText}>{signInError}</Text>
            )}

            <TouchableOpacity
              style={[
                S.btnPrimary,
                { opacity: canSubmit && !loading ? 1 : 0.5 },
              ]}
              onPress={handleSignIn}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              <Text style={S.btnPrimaryText}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Text>
            </TouchableOpacity>

            <View style={styles.helperRow}>
              <TouchableOpacity
                style={styles.helperBtn}
                onPress={handleForgot}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
              <Text style={styles.helperDot}>·</Text>
              <TouchableOpacity
                style={styles.helperBtn}
                onPress={startChange}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Change number?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Invite-link footer */}
          <View style={styles.inviteFooter}>
            <Text style={styles.inviteText}>
              Have an invite link? Tap it from your email or text message to
              create your account.
            </Text>
            {__DEV__ && (
              <TouchableOpacity
                style={styles.devLink}
                onPress={handleSimulateInvite}
                activeOpacity={0.7}
              >
                <Text style={styles.devLinkText}>
                  (dev) Simulate invite link →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Change number recovery */}
      <Modal
        visible={changeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setChangeOpen(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setChangeOpen(false)}
          accessibilityLabel="Close sheet"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            >
              <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
                <View style={styles.modalHead}>
                  <Text style={styles.modalTitle}>Change number</Text>
                  <Pressable
                    onPress={() => setChangeOpen(false)}
                    hitSlop={16}
                    style={({ pressed }) => [
                      styles.closeBtn,
                      pressed && styles.closeBtnPressed,
                    ]}
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                  >
                    <Text style={styles.closeIcon}>×</Text>
                  </Pressable>
                </View>

                {changeStep === 'enter_new' && (
                  <>
                    <Text style={styles.modalSub}>
                      Enter the new mobile number you want to use. We&apos;ll
                      text you a 6-digit code to confirm.
                    </Text>
                    <Text style={styles.label}>New mobile number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="(305) 555-0142"
                      placeholderTextColor="#64748b"
                      value={changeNewPhone}
                      onChangeText={setChangeNewPhone}
                      keyboardType="phone-pad"
                    />
                    {changeError && (
                      <Text style={styles.errorText}>{changeError}</Text>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.modalPrimary,
                        { opacity: changeNewPhone.trim() && !changeBusy ? 1 : 0.5 },
                      ]}
                      onPress={sendChangeCode}
                      disabled={!changeNewPhone.trim() || changeBusy}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.modalPrimaryText}>
                        {changeBusy ? 'Sending…' : 'Send SMS code'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {changeStep === 'verify_new' && (
                  <>
                    <Text style={styles.modalSub}>
                      We sent a 6-digit code to {changeNewPhone}. Enter it to
                      save the new number. You&apos;ll then sign in with your
                      username and this new number.
                    </Text>
                    <Text style={styles.label}>6-digit code</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123 456"
                      placeholderTextColor="#64748b"
                      value={changeNewCode}
                      onChangeText={setChangeNewCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    {changeError && (
                      <Text style={styles.errorText}>{changeError}</Text>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.modalPrimary,
                        { opacity: changeNewCode.length === 6 && !changeBusy ? 1 : 0.5 },
                      ]}
                      onPress={finishChange}
                      disabled={changeNewCode.length !== 6 || changeBusy}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.modalPrimaryText}>
                        {changeBusy ? 'Saving…' : 'Save new number'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalSecondary}
                      onPress={() => setChangeStep('enter_new')}
                      disabled={changeBusy}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalSecondaryText}>
                        Wrong number? Go back
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  hero: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    paddingVertical: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border2,
    marginBottom: SPACING.lg,
  },
  logoImage: {
    width: 92,
    height: 92,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.indigo,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.text2,
    textAlign: 'center',
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  helperBtn: {
    paddingVertical: 4,
  },
  helperDot: {
    color: COLORS.text3,
    fontSize: 14,
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.text3,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
    borderColor: COLORS.border2,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  modalClose: {
    fontSize: 26,
    fontWeight: '300',
    color: COLORS.text3,
    paddingHorizontal: SPACING.sm,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: COLORS.surface2,
    transform: [{ scale: 0.94 }],
  },
  closeIcon: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 28,
    marginTop: -2,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.text2,
    lineHeight: 18,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text2,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border2,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalPrimary: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  modalPrimaryText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondary: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  modalSecondaryText: {
    color: COLORS.text2,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  inviteFooter: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  inviteText: {
    fontSize: 12,
    color: COLORS.text3,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: SPACING.md,
  },
  devLink: {
    marginTop: SPACING.md,
    paddingVertical: 6,
  },
  devLinkText: {
    fontSize: 11,
    color: COLORS.indigo,
    fontWeight: '600',
  },
})
