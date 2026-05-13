// src/components/BottomSheet.tsx
// Reusable bottom-sheet modal with all the back/dismiss fixes baked in:
//   - Tap on the dimmed backdrop to dismiss
//   - Swipe down on the sheet to dismiss (iOS-native feel)
//   - Hardware back on Android dismisses (via onRequestClose)
//   - Big × close button (44×44 hit zone) with visible press feedback
//   - presentationStyle="overFullScreen" on iOS to avoid system gesture conflicts
//
// Usage:
//   <BottomSheet visible={open} onClose={...} title="Send invitation">
//     ...content...
//   </BottomSheet>

import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { COLORS, SPACING, RADIUS } from '../theme'

type Props = {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Cap the sheet height. Default '85%'. */
  maxHeight?: `${number}%` | number
  /** Allow content to scroll. Default true. */
  scrollable?: boolean
  /** Disable swipe-down gesture if the content needs the gesture. Default false. */
  disableSwipeDown?: boolean
}

export default function BottomSheet({
  visible,
  onClose,
  title,
  children,
  maxHeight = '85%',
  scrollable = true,
  disableSwipeDown = false,
}: Props) {
  const translateY = useRef(new Animated.Value(0)).current

  // Reset translation whenever the sheet re-opens
  useEffect(() => {
    if (visible) translateY.setValue(0)
  }, [visible, translateY])

  // Swipe-down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        if (disableSwipeDown) return false
        // Only respond to mostly-vertical downward gestures
        return g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx)
      },
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.6) {
          // Dismiss
          Animated.timing(translateY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0)
            onClose()
          })
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start()
        }
      },
    })
  ).current

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      {/* Tap-anywhere-on-backdrop dismisses */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close sheet"
      >
        {/* Inner Pressable with no onPress prevents bubbling so taps inside the
            card don't dismiss. */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.cardWrap, { maxHeight: maxHeight as never }]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flexShrink: 1 }}
          >
            <Animated.View
              style={[
                styles.card,
                { transform: [{ translateY }] },
              ]}
            >
              {/* Drag handle / header */}
              <View {...panResponder.panHandlers}>
                <View style={styles.handle} />
                {(title || true) && (
                  <View style={styles.headerRow}>
                    <Text style={styles.title}>{title ?? ''}</Text>
                    <Pressable
                      onPress={onClose}
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
                )}
              </View>

              {scrollable ? (
                <ScrollView
                  style={{ flexShrink: 1 }}
                  contentContainerStyle={styles.body}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              ) : (
                <View style={styles.body}>{children}</View>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  cardWrap: {
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1,
    borderColor: COLORS.border2,
    paddingBottom: SPACING.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border2,
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
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
  body: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
})
