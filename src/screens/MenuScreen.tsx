// src/screens/MenuScreen.tsx
// "More" tab. Profile header, grouped settings list (Reports / Invites
// at the top), accessibility add-on, dev role switch, sign out.

import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'
import ReportsScreen from './ReportsScreen'
import PalLinkScreen from './PalLinkScreen'
import { useA11y } from '../context/AccessibilityContext'

type Item = {
  id: string
  label: string
  helper?: string
  glyph: string
  group: 'reports' | 'invites' | 'audit' | 'system'
  destructive?: boolean
  onPress?: () => void
}

type Props = {
  currentRole?: 'org' | 'patient'
  onSwitchRole?: (role: 'org' | 'patient') => void
  onSignOut?: () => void
}

export default function MenuScreen({
  currentRole = 'org',
  onSwitchRole,
  onSignOut,
}: Props) {
  const a11y = useA11y()

  const [reportsOpen, setReportsOpen] = useState(false)
  const [palOpen, setPalOpen] = useState(false)

  const items: Item[] = [
    { id: 'rep',  label: 'Reports',                helper: 'Per-org and per-location performance', glyph: '◍', group: 'reports', onPress: () => setReportsOpen(true) },
    { id: 'inv',  label: 'Invites',                helper: 'Send sign-up links for individual or org', glyph: '↗', group: 'invites' },
    { id: 'pal',  label: 'PAL link',               helper: 'Share access requests with patients',  glyph: '◐', group: 'invites', onPress: () => setPalOpen(true) },
    { id: 'aud',  label: 'Audit trail',            helper: 'Verification & decision history',      glyph: '◌', group: 'audit' },
    { id: 'set',  label: 'Settings',               glyph: '⚙', group: 'system' },
    { id: 'help', label: 'Help & support',         glyph: '?', group: 'system' },
  ]

  const groups: { key: Item['group']; title: string }[] = [
    { key: 'reports', title: 'Reports' },
    { key: 'invites', title: 'Invites & access' },
    { key: 'audit',   title: 'Audit' },
    { key: 'system',  title: 'System' },
  ]

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You will be signed out of this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: onSignOut },
    ])
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <Text style={[S.pageTitle, { fontSize: a11y.ts(22), color: a11y.textColor(COLORS.text) }]}>
          More
        </Text>
        <Text style={[S.pageSub, { fontSize: a11y.ts(12) }]}>
          Account · Reports · Invites · Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>MD</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>
              {currentRole === 'patient' ? 'Michael Deharo' : 'Dr. Michael Deharo'}
            </Text>
            <Text style={styles.profileMeta}>
              {currentRole === 'patient'
                ? 'Patient · Verified ID'
                : 'Miami Medical Group · Owner'}
            </Text>
          </View>
          <View style={styles.trustPill}>
            <Text style={styles.trustPillText}>TRUSTED</Text>
          </View>
        </View>

        {groups.map((g) => {
          const groupItems = items.filter((i) => i.group === g.key)
          if (!groupItems.length) return null
          return (
            <View key={g.key} style={{ marginBottom: SPACING.lg }}>
              <Text style={S.sectionTitle}>{g.title}</Text>
              {groupItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={S.listRow}
                  activeOpacity={0.7}
                  onPress={
                    item.onPress ??
                    (() => Alert.alert('Coming soon', `${item.label} screen.`))
                  }
                >
                  <View style={S.listIcon}>
                    <Text style={styles.iconGlyph}>{item.glyph}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.helper && (
                      <Text style={styles.itemHelper}>{item.helper}</Text>
                    )}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )
        })}

        {/* Accessibility add-on */}
        <Text style={S.sectionTitle}>Accessibility</Text>
        <View style={styles.toggleCard}>
          <ToggleRow label="Higher contrast"
            helper="Stronger borders, brighter text on dark backgrounds."
            value={a11y.higherContrast} onValueChange={a11y.setHigherContrast} />
          <ToggleRow label="Larger text"
            helper="Increase the size of body text across the app."
            value={a11y.largerText} onValueChange={a11y.setLargerText} />
          <ToggleRow label="Reduce motion"
            helper="Slide animations on modals replaced with fade."
            value={a11y.reduceMotion} onValueChange={a11y.setReduceMotion} />
          <ToggleRow label="Voice control"
            helper="Shows a banner indicating it's on. TTS engine requires a separate native module."
            value={a11y.voiceControl} onValueChange={a11y.setVoiceControl} isLast />
        </View>

        {/* Dev-only role switch */}
        {__DEV__ && (
          <>
            <Text style={S.sectionTitle}>Developer</Text>
            <View style={styles.toggleCard}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemLabel}>Account type</Text>
                  <Text style={styles.itemHelper}>
                    Demo switch — replaced by backend role detection.
                  </Text>
                </View>
                <View style={styles.roleSwitch}>
                  {(['org', 'patient'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => onSwitchRole?.(r)}
                      style={[
                        styles.roleSwitchBtn,
                        currentRole === r && styles.roleSwitchBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.roleSwitchText,
                          currentRole === r && styles.roleSwitchTextActive,
                        ]}
                      >
                        {r === 'org' ? 'Org' : 'Patient'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

        {/* Sign out */}
        <TouchableOpacity
          style={[S.listRow, { marginTop: SPACING.lg }]}
          activeOpacity={0.7}
          onPress={handleSignOut}
        >
          <View style={[S.listIcon, { backgroundColor: COLORS.redSoft }]}>
            <Text style={[styles.iconGlyph, { color: COLORS.red }]}>⏻</Text>
          </View>
          <Text style={[styles.itemLabel, { color: COLORS.red, flex: 1 }]}>
            Sign out
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>ConnecDNA · v1.0.0 · preview</Text>
      </ScrollView>

      {/* Reports modal */}
      <Modal
        visible={reportsOpen}
        animationType={a11y.motionType('slide')}
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setReportsOpen(false)}
      >
        <ReportsScreen onBack={() => setReportsOpen(false)} />
      </Modal>

      {/* PAL Link modal */}
      <Modal
        visible={palOpen}
        animationType={a11y.motionType('slide')}
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setPalOpen(false)}
      >
        <PalLinkScreen onBack={() => setPalOpen(false)} />
      </Modal>
    </SafeAreaView>
  )
}

function ToggleRow({
  label, helper, value, onValueChange, isLast,
}: {
  label: string
  helper: string
  value: boolean
  onValueChange: (v: boolean) => void
  isLast?: boolean
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemHelper}>{helper}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.border2, true: COLORS.indigo }}
        thumbColor={COLORS.white}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border2,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  avatar: {
    width: 52, height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.indigo,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18, fontWeight: '800',
    color: COLORS.white, letterSpacing: 0.6,
  },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  profileMeta: { fontSize: 12, color: COLORS.text3, marginTop: 2 },
  trustPill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)',
  },
  trustPillText: {
    fontSize: 10, fontWeight: '800',
    color: COLORS.green, letterSpacing: 0.8,
  },

  iconGlyph: { fontSize: 16, color: COLORS.indigo },
  itemLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemHelper: { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  chevron: { fontSize: 22, fontWeight: '300', color: COLORS.text3, marginLeft: SPACING.sm },

  toggleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: SPACING.md,
  },

  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.full, padding: 3,
  },
  roleSwitchBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  roleSwitchBtnActive: { backgroundColor: COLORS.text },
  roleSwitchText: { fontSize: 11, color: COLORS.text2, fontWeight: '700' },
  roleSwitchTextActive: { color: COLORS.bg },

  versionText: {
    fontSize: 11, color: COLORS.text3,
    textAlign: 'center', marginTop: SPACING.lg,
  },
})
