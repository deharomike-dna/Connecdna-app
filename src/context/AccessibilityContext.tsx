// src/context/AccessibilityContext.tsx
// Real, working accessibility settings. Provider holds the flags, screens
// consume via useA11y(). Effects:
//   - higherContrast: stronger borders, brighter foreground text
//   - largerText: 1.15x scaling on titles + body via ts() helper
//   - reduceMotion: callers should pass `motionType()` to Modal animationType
//   - voiceControl: shows a thin status banner; real TTS would need expo-speech

import React, { createContext, useContext, useMemo, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../theme'

export type A11ySettings = {
  higherContrast: boolean
  largerText: boolean
  reduceMotion: boolean
  voiceControl: boolean
}

type A11yContextValue = A11ySettings & {
  setHigherContrast: (v: boolean) => void
  setLargerText: (v: boolean) => void
  setReduceMotion: (v: boolean) => void
  setVoiceControl: (v: boolean) => void

  // Helpers components consume
  ts: (size: number) => number               // "text size" — applies larger-text scale
  motionType: (preferred?: 'slide' | 'fade' | 'none') => 'slide' | 'fade' | 'none'
  borderColor: (base?: string) => string
  textColor: (base?: string) => string
}

const DEFAULT: A11ySettings = {
  higherContrast: false,
  largerText: false,
  reduceMotion: false,
  voiceControl: false,
}

const A11yContext = createContext<A11yContextValue | null>(null)

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [higherContrast, setHigherContrast] = useState(DEFAULT.higherContrast)
  const [largerText, setLargerText]         = useState(DEFAULT.largerText)
  const [reduceMotion, setReduceMotion]     = useState(DEFAULT.reduceMotion)
  const [voiceControl, setVoiceControl]     = useState(DEFAULT.voiceControl)

  const value = useMemo<A11yContextValue>(() => ({
    higherContrast,
    largerText,
    reduceMotion,
    voiceControl,
    setHigherContrast,
    setLargerText,
    setReduceMotion,
    setVoiceControl,
    ts: (size: number) => Math.round(size * (largerText ? 1.18 : 1)),
    motionType: (preferred = 'slide') => (reduceMotion ? 'fade' : preferred),
    borderColor: (base = COLORS.border) =>
      higherContrast ? COLORS.border2 : base,
    textColor: (base = COLORS.text2) =>
      higherContrast ? COLORS.text : base,
  }), [higherContrast, largerText, reduceMotion, voiceControl])

  return (
    <A11yContext.Provider value={value}>
      {voiceControl && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Voice control on — text-to-speech requires a separate native module.
          </Text>
        </View>
      )}
      {children}
    </A11yContext.Provider>
  )
}

export function useA11y(): A11yContextValue {
  const v = useContext(A11yContext)
  if (!v) {
    // Fail open: return a no-op default so screens render even if the
    // provider isn't mounted (e.g. in tests or a Storybook).
    return {
      ...DEFAULT,
      setHigherContrast: () => {},
      setLargerText: () => {},
      setReduceMotion: () => {},
      setVoiceControl: () => {},
      ts: (s: number) => s,
      motionType: (p = 'slide') => p,
      borderColor: (b = COLORS.border) => b,
      textColor: (b = COLORS.text2) => b,
    }
  }
  return v
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.indigo,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  bannerText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
})
