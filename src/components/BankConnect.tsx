// src/components/BankConnect.tsx
// Plaid Link stub. Renders a Connect-bank card; tapping opens a sheet
// with a fake bank-picker. After "selecting" a bank, the parent gets
// a callback with a stubbed account object. Replace stub with the
// react-native-plaid-link-sdk integration once Plaid keys are wired.

import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native'
import { COLORS, S, SPACING, RADIUS } from '../theme'

export type LinkedAccount = {
  bankName: string
  mask: string // last-4
  accountType: 'checking' | 'savings'
  holderName: string
}

type Props = {
  account: LinkedAccount | null
  onConnected?: (a: LinkedAccount) => void
  helper?: string
}

const BANKS = [
  { name: 'Chase',                  color: '#1E40AF' },
  { name: 'Bank of America',        color: '#B91C1C' },
  { name: 'Wells Fargo',            color: '#B45309' },
  { name: 'Citi',                   color: '#0F766E' },
  { name: 'Capital One',            color: '#7C3AED' },
  { name: 'US Bank',                color: '#0F3A82' },
  { name: 'PNC Bank',               color: '#B45309' },
  { name: 'TD Bank',                color: '#15803D' },
  { name: 'Truist',                 color: '#7C3AED' },
  { name: 'Goldman Sachs',          color: '#0F172A' },
  { name: 'Morgan Stanley',         color: '#0F3A82' },
  { name: 'Charles Schwab',         color: '#1E3A8A' },
  { name: 'Fidelity',               color: '#0F766E' },
  { name: 'American Express Bank',  color: '#1E40AF' },
  { name: 'Discover Bank',          color: '#B45309' },
  { name: 'Ally Bank',              color: '#7C3AED' },
  { name: 'SoFi',                   color: '#0F766E' },
  { name: 'Marcus by Goldman',      color: '#B45309' },
  { name: 'HSBC',                   color: '#B91C1C' },
  { name: 'Citizens Bank',          color: '#15803D' },
  { name: 'Fifth Third Bank',       color: '#0F3A82' },
  { name: 'KeyBank',                color: '#B91C1C' },
  { name: 'Regions Bank',           color: '#15803D' },
  { name: 'Huntington Bank',        color: '#15803D' },
  { name: 'M&T Bank',               color: '#7C3AED' },
  { name: 'BMO Harris',             color: '#1E40AF' },
  { name: 'BB&T',                   color: '#7C3AED' },
  { name: 'SunTrust',               color: '#0F3A82' },
  { name: 'Santander',              color: '#B91C1C' },
  { name: 'BBVA',                   color: '#1E40AF' },
  { name: 'First Republic',         color: '#0F766E' },
  { name: 'Silicon Valley Bank',    color: '#0F3A82' },
  { name: 'Navy Federal CU',        color: '#1E3A8A' },
  { name: 'USAA',                   color: '#1E40AF' },
  { name: 'Zelle / Local Credit Union', color: '#7C3AED' },
  { name: 'Other (search by name)', color: '#475569' },
]

export default function BankConnect({
  account,
  onConnected,
  helper = 'Used for invoicing future payments. Funds are never stored in this app.',
}: Props) {
  const [linkOpen, setLinkOpen] = useState(false)

  const onPick = (bankName: string) => {
    setLinkOpen(false)
    setTimeout(() => {
      onConnected?.({
        bankName,
        mask: String(Math.floor(1000 + Math.random() * 9000)),
        accountType: 'checking',
        holderName: 'Michael Deharo',
      })
    }, 300)
  }

  if (account) {
    return (
      <View style={styles.linkedCard}>
        <View style={styles.linkedTop}>
          <View>
            <Text style={styles.linkedKicker}>BANK ON FILE</Text>
            <Text style={styles.linkedName}>{account.bankName}</Text>
          </View>
          <View style={styles.verifiedPill}>
            <Text style={styles.verifiedText}>VERIFIED</Text>
          </View>
        </View>
        <Text style={styles.linkedNumber}>•••• •••• •••• {account.mask}</Text>
        <View style={styles.linkedBottom}>
          <View>
            <Text style={styles.linkedSmall}>HOLDER</Text>
            <Text style={styles.linkedVal}>{account.holderName}</Text>
          </View>
          <View>
            <Text style={styles.linkedSmall}>TYPE</Text>
            <Text style={styles.linkedVal}>
              {account.accountType.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setLinkOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.changeBtn}>Change</Text>
          </TouchableOpacity>
        </View>

        <PickerModal
          visible={linkOpen}
          onClose={() => setLinkOpen(false)}
          onPick={onPick}
        />
      </View>
    )
  }

  return (
    <View style={styles.connectCard}>
      <View style={styles.connectIcon}>
        <Text style={styles.connectGlyph}>🏦</Text>
      </View>
      <Text style={styles.connectTitle}>Connect your bank</Text>
      <Text style={styles.connectSub}>{helper}</Text>

      <TouchableOpacity
        style={S.btnPrimary}
        onPress={() => setLinkOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={S.btnPrimaryText}>Connect bank</Text>
      </TouchableOpacity>

      <Text style={styles.poweredBy}>
        Bank connection powered by{' '}
        <Text style={styles.poweredByStrong}>Plaid</Text>
      </Text>

      <PickerModal
        visible={linkOpen}
        onClose={() => setLinkOpen(false)}
        onPick={onPick}
      />
    </View>
  )
}

function PickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean
  onClose: () => void
  onPick: (bankName: string) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return BANKS
    return BANKS.filter((b) => b.name.toLowerCase().includes(q))
  }, [query])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalCard, { maxHeight: '85%' }]}
          >
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Connect with Plaid</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Search and select your bank. You&apos;ll sign in with your
              bank&apos;s credentials inside Plaid&apos;s secure window.
            </Text>

            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search banks…"
                placeholderTextColor={COLORS.text3}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Text style={styles.searchClear}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              style={styles.bankList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filtered.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No banks match "{query}".</Text>
                  <Text style={styles.emptySub}>
                    Try a shorter name. We support 11,000+ US institutions
                    via Plaid.
                  </Text>
                </View>
              ) : (
                filtered.map((b) => (
                  <TouchableOpacity
                    key={b.name}
                    style={styles.bankRow}
                    onPress={() => onPick(b.name)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[styles.bankDot, { backgroundColor: b.color }]}
                    >
                      <Text style={styles.bankDotText}>
                        {b.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.bankRowText}>{b.name}</Text>
                    <Text style={styles.bankChevron}>›</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <Text style={styles.legal}>
              ConnecDNA does not see or store your bank password. Your bank
              account is read-only and used to invoice future payments.
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // Connect card (no account on file)
  connectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  connectIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  connectGlyph: { fontSize: 28 },
  connectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  connectSub: {
    fontSize: 12,
    color: COLORS.text2,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  poweredBy: {
    fontSize: 11,
    color: COLORS.text3,
    marginTop: SPACING.md,
  },
  poweredByStrong: {
    fontWeight: '800',
    color: COLORS.text2,
  },

  // Linked-account card
  linkedCard: {
    backgroundColor: '#0f3a82',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    minHeight: 168,
  },
  linkedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  linkedKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  linkedName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.4,
  },
  verifiedPill: {
    backgroundColor: 'rgba(34,197,94,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#86efac',
    letterSpacing: 0.6,
  },
  linkedNumber: {
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 2,
    marginVertical: SPACING.lg,
  },
  linkedBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  linkedSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  linkedVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.4,
  },
  changeBtn: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
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
  modalSub: {
    fontSize: 13,
    color: COLORS.text2,
    lineHeight: 18,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border2,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchIcon: {
    fontSize: 16,
    color: COLORS.text3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  searchClear: {
    fontSize: 22,
    color: COLORS.text3,
    paddingHorizontal: 4,
  },
  bankList: {
    maxHeight: 380,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  bankDot: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankDotText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  bankRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  bankChevron: {
    fontSize: 22,
    color: COLORS.text3,
    fontWeight: '300',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text2,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  legal: {
    fontSize: 11,
    color: COLORS.text3,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: SPACING.lg,
  },
})
