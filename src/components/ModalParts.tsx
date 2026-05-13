// src/components/ModalParts.tsx
// Shared, drop-in pieces for every existing Modal in the app.
//   - <ModalBackdrop onClose>: tap-to-dismiss dimmed area
//   - <ModalCloseButton onPress>: 44×44 Pressable with visible feedback
// These let us patch every modal without rewriting their structure.

import React from 'react'
import { Pressable, Text, StyleSheet, View, StyleProp, ViewStyle } from 'react-native'
import { COLORS } from '../theme'

export function ModalBackdrop({
  onClose,
  children,
  style,
}: {
  onClose: () => void
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      style={[styles.backdrop, style]}
      onPress={onClose}
      accessibilityLabel="Close"
    >
      {children}
    </Pressable>
  )
}

/**
 * Wraps the inner card so taps on it don't bubble up to the backdrop's
 * onPress. Use as the outer element of every modal card.
 */
export function ModalCard({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={style}
      accessibilityRole="none"
    >
      <View pointerEvents="box-none">{children}</View>
    </Pressable>
  )
}

export function ModalCloseButton({
  onPress,
  label = 'Close',
}: {
  onPress: () => void
  label?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={16}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.closeBtn,
        pressed && styles.closeBtnPressed,
      ]}
    >
      <Text style={styles.closeIcon}>×</Text>
    </Pressable>
  )
}

export function ModalBackButton({
  onPress,
  label = 'Back',
}: {
  onPress: () => void
  label?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={16}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.backBtn,
        pressed && styles.backBtnPressed,
      ]}
    >
      <Text style={styles.backText}>‹ Back</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  backBtn: {
    minWidth: 80,
    minHeight: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  backBtnPressed: {
    opacity: 0.5,
  },
  backText: {
    color: COLORS.indigo,
    fontSize: 16,
    fontWeight: '700',
  },
})
