// src/screens/TwoFactorScreen.tsx
// 6-digit SMS code entry. Used as both:
//   - Full screen after sign-in (mode="signin")
//   - Modal gate before claim submit (mode="submit")
//
// Backend wiring: replace `requestCode` and `verifyCode` with real
// Twilio Verify endpoints. For now any 6-digit code is accepted.

import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'
import { api } from '../api/client'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'submit'

type Props = {
  mode?: Mode
  /** Display hint like "***42". If not given we'll ask Supabase for the user's phone. */
  phoneHint?: string
  /** Phone number to send the OTP to. If omitted, we look it up from the user's profile. */
  phone?: string
  onVerified?: () => void
  onCancel?: () => void
  onResend?: () => void
}

const RESEND_SECONDS = 30

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 2 ? `***${digits.slice(-2)}` : '***'
}

export default function TwoFactorScreen({
  mode = 'signin',
  phoneHint,
  phone: phoneProp,
  onVerified,
  onCancel,
  onResend,
}: Props) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [phone, setPhone] = useState<string | null>(phoneProp ?? null)
  const [errorText, setErrorText] = useState<string | null>(null)

  const inputs = useRef<Array<TextInput | null>>([])

  // Resolve phone number from Supabase user metadata if not provided.
  useEffect(() => {
    if (phoneProp) {
      setPhone(phoneProp)
      return
    }
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      const userPhone = data.user?.phone || (data.user?.user_metadata as { phone?: string } | undefined)?.phone || null
      setPhone(userPhone)
      // Auto-send OTP when we know the phone
      if (userPhone) {
        api.sendSmsOtp(userPhone).catch((e: { message?: string }) => {
          setErrorText(e.message ?? 'Could not send code.')
        })
      }
    })
    return () => { cancelled = true }
  }, [phoneProp])

  const displayHint = phoneHint ?? maskPhone(phone)

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  const setDigit = (i: number, v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = cleaned
    setDigits(next)
    if (cleaned && i < 5) inputs.current[i + 1]?.focus()
    if (next.every((d) => d.length === 1)) verify(next.join(''))
  }

  const onKeyPress = (i: number, key: string) => {
    if (key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const verify = async (code: string) => {
    if (code.length !== 6 || !phone) return
    setErrorText(null)
    setVerifying(true)
    try {
      await api.verifySmsOtp(phone, code)
      api.logAudit('signin.2fa.verified', {
        mode,
        maskedPhone: maskPhone(phone),
      })
      onVerified?.()
    } catch (e) {
      const err = e as { message?: string }
      setErrorText(err.message ?? 'Invalid or expired code.')
      setDigits(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }

  const resend = async () => {
    if (secondsLeft > 0 || !phone) return
    setErrorText(null)
    setSecondsLeft(RESEND_SECONDS)
    try {
      await api.sendSmsOtp(phone)
      onResend?.()
      Alert.alert('Code sent', `A new 6-digit code was sent to ${displayHint}.`)
    } catch (e) {
      const err = e as { message?: string }
      setErrorText(err.message ?? 'Could not resend code.')
    }
  }

  const headline =
    mode === 'submit' ? 'Confirm submission' : 'Enter the code'

  const subline =
    mode === 'submit'
      ? `Submitting requires a fresh verification. We sent a 6-digit code to ${displayHint}.`
      : phone
      ? `We sent a 6-digit code to ${displayHint} via SMS. Enter it below to continue.`
      : 'Looking up your phone number…'

  return (
    <SafeAreaView style={S.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} hitSlop={12}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.center}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoGlyph}>◊</Text>
          </View>

          <Text style={styles.title}>{headline}</Text>
          <Text style={styles.sub}>{subline}</Text>

          <View style={styles.codeRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r
                }}
                style={[styles.codeInput, d && styles.codeInputFilled]}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={({ nativeEvent }) =>
                  onKeyPress(i, nativeEvent.key)
                }
                returnKeyType="done"
                editable={!verifying}
                textAlign="center"
              />
            ))}
          </View>

          {verifying && (
            <Text style={styles.verifying}>Verifying…</Text>
          )}
          {errorText && (
            <Text style={styles.errorText}>{errorText}</Text>
          )}

          <TouchableOpacity
            onPress={resend}
            disabled={secondsLeft > 0}
            activeOpacity={0.7}
            style={styles.resend}
          >
            <Text
              style={[
                styles.resendText,
                secondsLeft > 0 && { color: COLORS.text3 },
              ]}
            >
              {secondsLeft > 0
                ? `Resend code in ${secondsLeft}s`
                : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 44,
  },
  cancel: {
    color: COLORS.text2,
    fontSize: 14,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  logoGlyph: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: COLORS.text2,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  codeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  codeInput: {
    width: 44,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border2,
    backgroundColor: COLORS.surface,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  codeInputFilled: {
    borderColor: COLORS.indigo,
    backgroundColor: COLORS.surface2,
  },
  verifying: {
    fontSize: 12,
    color: COLORS.text3,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: '700',
  },
  resend: {
    paddingVertical: SPACING.md,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.indigo,
  },
})
