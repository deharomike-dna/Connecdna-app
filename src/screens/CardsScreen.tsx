// src/screens/CardsScreen.tsx
// ConnecDNA Credentials = People in the organization. Each row is a
// member with their role and credential status (pending / active /
// expiring). Tap a row to view their full credential set. "+ Invite"
// opens an SMS-link sheet (Twilio wiring is a backend task).

import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'
import BankConnect, { LinkedAccount } from '../components/BankConnect'
import { api } from '../api/client'
import { ModalBackdrop, ModalCard, ModalCloseButton } from '../components/ModalParts'

type MemberStatus = 'pending' | 'active' | 'expiring'

type Member = {
  id: string
  name: string
  role: string
  status: MemberStatus
  daysToExpiry?: number // for "expiring" — drives Twilio cadence (30/15/7)
  initials: string
  expiresOn?: string
}

const MEMBERS: Member[] = [
  { id: '1', name: 'Dr. Michael Deharo', role: 'Owner · MD',         status: 'active',   initials: 'MD', expiresOn: '11 / 2027' },
  { id: '2', name: 'Dr. Ana Reyes',      role: 'Physician · MD',     status: 'expiring', initials: 'AR', daysToExpiry: 12, expiresOn: '05 / 19 / 2026' },
  { id: '3', name: 'Jordan Park, NP',    role: 'Nurse Practitioner', status: 'active',   initials: 'JP', expiresOn: '08 / 2027' },
  { id: '4', name: 'Sam Lee, MA',        role: 'Medical Assistant',  status: 'active',   initials: 'SL', expiresOn: '01 / 2028' },
  { id: '5', name: 'Riley Cohen',        role: 'Practice Admin',     status: 'pending',  initials: 'RC' },
]

function statusMeta(s: MemberStatus) {
  if (s === 'active')   return { label: 'ACTIVE',   color: COLORS.green, soft: COLORS.greenSoft }
  if (s === 'pending')  return { label: 'PENDING',  color: COLORS.blue,  soft: COLORS.blueSoft }
  return                       { label: 'EXPIRING', color: COLORS.amber, soft: COLORS.amberSoft }
}

export default function CardsScreen() {
  const [filter, setFilter] = useState<'all' | MemberStatus>('all')
  const [selected, setSelected] = useState<Member | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteRole, setInviteRole] = useState<'np' | 'ma' | 'admin' | 'physician'>('np')
  const [sending, setSending] = useState(false)

  // Renew flow
  const [renewOpen, setRenewOpen] = useState<Member | null>(null)
  const [renewBank, setRenewBank] = useState<LinkedAccount | null>(null)
  const [paying, setPaying] = useState(false)

  // Send-reminder flow (functional Twilio stub)
  const [reminderSending, setReminderSending] = useState<string | null>(null)
  const sendReminder = (member: Member) => {
    setReminderSending(member.id)
    setTimeout(() => {
      setReminderSending(null)
      setSelected(null)
      Alert.alert(
        'Reminder sent',
        `SMS sent via Twilio to ${member.name}. Reminder cadence: 30 / 15 / 7 days before expiration.`
      )
    }, 700)
  }

  const RENEWAL_FEE = 245
  const startRenew = (member: Member) => {
    setSelected(null)
    setRenewBank(null)
    setRenewOpen(member)
  }
  const submitRenew = () => {
    if (!renewBank || !renewOpen) return
    setPaying(true)
    setTimeout(() => {
      setPaying(false)
      const m = renewOpen
      setRenewOpen(null)
      Alert.alert(
        'Renewal submitted',
        `$${RENEWAL_FEE} invoice created for ${m.name}. Payment scheduled from ${renewBank.bankName} ••${renewBank.mask}.`
      )
    }, 800)
  }

  const counts = useMemo(() => ({
    all:      MEMBERS.length,
    active:   MEMBERS.filter((m) => m.status === 'active').length,
    pending:  MEMBERS.filter((m) => m.status === 'pending').length,
    expiring: MEMBERS.filter((m) => m.status === 'expiring').length,
  }), [])

  const visible = useMemo(
    () => filter === 'all' ? MEMBERS : MEMBERS.filter((m) => m.status === filter),
    [filter]
  )

  const sendInvite = async () => {
    const digits = invitePhone.replace(/\D/g, '')
    if (digits.length < 10) {
      Alert.alert('Phone required', 'Enter a valid US phone number.')
      return
    }
    setSending(true)
    try {
      const roleLabel =
        inviteRole === 'physician' ? 'Physician'
        : inviteRole === 'np'      ? 'Nurse Practitioner'
        : inviteRole === 'ma'      ? 'Medical Assistant'
        : 'Practice Admin'
      await api.sendInvite({
        helperName: roleLabel,
        helperPhone: invitePhone.trim(),
        helperRole: inviteRole,
        permissionLevel: inviteRole === 'admin' ? 'admin' : 'standard',
      })
      api.logAudit('invite.sent', { method: 'sms', helperRole: inviteRole })
      setInviteOpen(false)
      setInvitePhone('')
      Alert.alert(
        'Invite sent',
        `An SMS with a sign-up link was sent to ${invitePhone}. The new account will be linked to Miami Medical Group.`
      )
    } catch (e) {
      const err = e as { message?: string }
      Alert.alert(
        'Invite failed',
        err.message ?? 'Could not send invite. Check your network and try again.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <View style={S.spaceBetween}>
          <View>
            <Text style={S.pageTitle}>Credentials</Text>
            <Text style={S.pageSub}>
              {counts.all} members · {counts.expiring} expiring soon
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => setInviteOpen(true)}
          >
            <Text style={styles.addBtnText}>+ Invite</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter pills */}
        <View style={styles.filterRow}>
          {(['all', 'active', 'expiring', 'pending'] as const).map((k) => {
            const active = filter === k
            const count =
              k === 'all' ? counts.all :
              k === 'active' ? counts.active :
              k === 'expiring' ? counts.expiring : counts.pending
            const label = k.charAt(0).toUpperCase() + k.slice(1)
            return (
              <TouchableOpacity
                key={k}
                style={[styles.filter, active && styles.filterActive]}
                onPress={() => setFilter(k)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {label} · {count}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Member list */}
        {visible.map((m) => {
          const meta = statusMeta(m.status)
          return (
            <TouchableOpacity
              key={m.id}
              style={styles.row}
              onPress={() => setSelected(m)}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{m.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.role}>{m.role}</Text>
                {m.status === 'expiring' && m.daysToExpiry !== undefined && (
                  <Text style={styles.alertLine}>
                    Expires in {m.daysToExpiry} days · alerts at 30 / 15 / 7
                  </Text>
                )}
                {m.status === 'pending' && (
                  <Text style={styles.alertPending}>
                    Awaiting credential upload
                  </Text>
                )}
              </View>
              <View style={[styles.pill, { backgroundColor: meta.soft }]}>
                <Text style={[styles.pillText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Member detail sheet */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <ModalBackdrop onClose={() => setSelected(null)} style={{ justifyContent: 'flex-end' }}>
          <ModalCard style={styles.modalCard}>
            <View style={S.spaceBetween}>
              <Text style={styles.modalTitle}>
                {selected?.name ?? ''}
              </Text>
              <ModalCloseButton onPress={() => setSelected(null)} />
            </View>

            {selected && (
              <>
                <Text style={styles.modalSub}>{selected.role}</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Status</Text>
                  <Text
                    style={[
                      styles.detailVal,
                      { color: statusMeta(selected.status).color },
                    ]}
                  >
                    {statusMeta(selected.status).label}
                  </Text>
                </View>
                {selected.expiresOn && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>License expires</Text>
                    <Text style={styles.detailVal}>{selected.expiresOn}</Text>
                  </View>
                )}
                {selected.status === 'expiring' && (
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailKey}>Reminder schedule</Text>
                    <Text style={styles.detailVal}>SMS at 30 / 15 / 7 d</Text>
                  </View>
                )}

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.actBtnGhost}
                    activeOpacity={0.85}
                    onPress={() => sendReminder(selected)}
                    disabled={reminderSending === selected.id}
                  >
                    {reminderSending === selected.id ? (
                      <ActivityIndicator color={COLORS.text2} />
                    ) : (
                      <Text style={styles.actBtnGhostText}>Send reminder</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.btnPrimary, { flex: 1 }]}
                    activeOpacity={0.85}
                    onPress={() => startRenew(selected)}
                  >
                    <Text style={S.btnPrimaryText}>Renew credential</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ModalCard>
        </ModalBackdrop>
      </Modal>

      {/* Invite via SMS sheet */}
      <Modal
        visible={inviteOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteOpen(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <ModalBackdrop onClose={() => setInviteOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        >
          <ModalCard style={styles.modalCard}>
            <View style={S.spaceBetween}>
              <Text style={styles.modalTitle}>Invite a team member</Text>
              <ModalCloseButton onPress={() => setInviteOpen(false)} />
            </View>

            <Text style={styles.modalSub}>
              We&apos;ll send an SMS with a sign-up link. Once they create
              their account, they&apos;ll join Miami Medical Group with the
              role you pick below.
            </Text>

            <Text style={S.label}>Role</Text>
            <View style={styles.roleGrid}>
              {([
                { k: 'physician', label: 'Physician' },
                { k: 'np',        label: 'NP' },
                { k: 'ma',        label: 'Medical Assistant' },
                { k: 'admin',     label: 'Admin' },
              ] as const).map((r) => (
                <TouchableOpacity
                  key={r.k}
                  onPress={() => setInviteRole(r.k)}
                  style={[
                    styles.roleChip,
                    inviteRole === r.k && styles.roleChipActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      inviteRole === r.k && styles.roleChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: SPACING.md }}>
              <Text style={S.label}>Mobile number</Text>
              <TextInput
                style={S.input}
                placeholder="(305) 555-0142"
                placeholderTextColor={COLORS.text3}
                value={invitePhone}
                onChangeText={setInvitePhone}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[
                S.btnPrimary,
                { marginTop: SPACING.lg, opacity: sending ? 0.6 : 1 },
              ]}
              onPress={sendInvite}
              disabled={sending}
              activeOpacity={0.85}
            >
              <Text style={S.btnPrimaryText}>
                {sending ? 'Sending invite…' : 'Send SMS invite'}
              </Text>
            </TouchableOpacity>
          </ModalCard>
        </ScrollView>
        </KeyboardAvoidingView>
        </ModalBackdrop>
      </Modal>

      {/* Renew credential modal */}
      <Modal
        visible={renewOpen !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRenewOpen(null)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <ModalBackdrop onClose={() => setRenewOpen(null)}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
          >
            <ModalCard style={styles.modalCard}>
              <View style={S.spaceBetween}>
                <Text style={styles.modalTitle}>Renew credential</Text>
                <ModalCloseButton onPress={() => setRenewOpen(null)} />
              </View>

              {renewOpen && (
                <>
                  <Text style={styles.modalSub}>
                    Renewing for {renewOpen.name}. The renewal includes
                    state-board fees and ConnecDNA processing.
                  </Text>

                  {/* Invoice */}
                  <View style={styles.invoice}>
                    <Text style={styles.invoiceTitle}>Invoice</Text>
                    <View style={styles.invoiceLine}>
                      <Text style={styles.invoiceKey}>State board renewal fee</Text>
                      <Text style={styles.invoiceVal}>$200.00</Text>
                    </View>
                    <View style={styles.invoiceLine}>
                      <Text style={styles.invoiceKey}>ConnecDNA processing</Text>
                      <Text style={styles.invoiceVal}>$45.00</Text>
                    </View>
                    <View style={[styles.invoiceLine, styles.invoiceTotal]}>
                      <Text style={[styles.invoiceKey, { color: COLORS.text }]}>Total</Text>
                      <Text style={[styles.invoiceVal, { color: COLORS.text }]}>${RENEWAL_FEE}.00</Text>
                    </View>
                  </View>

                  {/* Bank picker */}
                  <Text style={S.sectionTitle}>Pay from</Text>
                  <BankConnect
                    account={renewBank}
                    onConnected={setRenewBank}
                    helper="Funds are pulled only after you confirm. ConnecDNA does not store funds."
                  />

                  <TouchableOpacity
                    style={[
                      S.btnPrimary,
                      { marginTop: SPACING.lg, opacity: renewBank && !paying ? 1 : 0.5 },
                    ]}
                    disabled={!renewBank || paying}
                    onPress={submitRenew}
                    activeOpacity={0.85}
                  >
                    {paying ? (
                      <ActivityIndicator color={COLORS.bg} />
                    ) : (
                      <Text style={S.btnPrimaryText}>
                        {renewBank
                          ? `Pay $${RENEWAL_FEE} & submit renewal`
                          : 'Connect a bank to continue'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ModalCard>
          </ScrollView>
        </ModalBackdrop>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  addBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.text,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bg,
    letterSpacing: 0.3,
  },

  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  filter: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterActive: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.border2,
  },
  filterText: { fontSize: 12, fontWeight: '700', color: COLORS.text3 },
  filterTextActive: { color: COLORS.text },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  role: { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  alertLine: { fontSize: 11, color: COLORS.amber, marginTop: 4, fontWeight: '700' },
  alertPending: { fontSize: 11, color: COLORS.blue, marginTop: 4, fontWeight: '700' },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },

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
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailKey: { fontSize: 12, color: COLORS.text3, fontWeight: '700' },
  detailVal: { fontSize: 13, color: COLORS.text, fontWeight: '700' },

  detailActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  actBtnGhost: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border2,
  },
  actBtnGhostText: { color: COLORS.text2, fontSize: 13, fontWeight: '800' },

  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  roleChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleChipActive: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.indigo,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text3,
  },
  roleChipTextActive: { color: COLORS.text },

  invoice: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  invoiceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  invoiceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  invoiceTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 4,
    paddingTop: 12,
  },
  invoiceKey: {
    fontSize: 13,
    color: COLORS.text2,
  },
  invoiceVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text2,
    fontFamily: 'Courier',
  },
})
