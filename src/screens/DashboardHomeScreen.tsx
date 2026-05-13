// src/screens/DashboardHomeScreen.tsx
// New home tab. Pill toggle Individual / Organization. Each side shows
// the cards relevant to that audience: insurance / IDs, send-invite,
// bank account.

import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'
import BankConnect, { LinkedAccount } from '../components/BankConnect'
import { api } from '../api/client'
import { ModalBackdrop, ModalCard, ModalCloseButton } from '../components/ModalParts'

type Audience = 'individual' | 'business'

const ORG_LOCATIONS = [
  { id: '1', name: 'Miami Medical Group',  address: '1234 Biscayne Blvd, Miami, FL 33132',  patients: 482, status: 'active' as const },
  { id: '2', name: 'Coral Gables Annex',   address: '88 Galiano St, Coral Gables, FL 33134', patients: 214, status: 'active' as const },
  { id: '3', name: 'Brickell Telehealth',  address: 'Virtual',                               patients: 96,  status: 'active' as const },
]

export default function DashboardHomeScreen() {
  const [audience, setAudience] = useState<Audience>('business')
  const [individualBank, setIndividualBank] = useState<LinkedAccount | null>(null)
  const [businessBank, setBusinessBank] = useState<LinkedAccount | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteKind, setInviteKind] = useState<'individual' | 'business'>('individual')
  const [inviteContact, setInviteContact] = useState('')
  const [inviteMethod, setInviteMethod] = useState<'sms' | 'email'>('sms')
  const [sending, setSending] = useState(false)

  const sendInvite = async () => {
    if (!inviteContact.trim()) {
      Alert.alert('Required', `Enter a${inviteMethod === 'sms' ? ' phone number' : 'n email address'}.`)
      return
    }
    setSending(true)
    try {
      const role = inviteKind === 'individual' ? 'patient' : 'workspace_partner'
      await api.sendInvite({
        helperName: inviteKind === 'individual' ? 'Patient invite' : 'Business invite',
        helperPhone: inviteMethod === 'sms' ? inviteContact.trim() : undefined,
        helperEmail: inviteMethod === 'email' ? inviteContact.trim() : undefined,
        helperRole: role,
        permissionLevel: 'standard',
      })
      api.logAudit('invite.sent', {
        method: inviteMethod,
        role,
        audience,
      })
      setInviteOpen(false)
      Alert.alert(
        'Invite sent',
        `${inviteMethod === 'sms' ? 'SMS' : 'Email'} sent to ${inviteContact}. They'll receive a sign-up link tied to your ${audience === 'individual' ? 'account' : 'business'}.`
      )
      setInviteContact('')
    } catch (e) {
      const err = e as { message?: string; status?: number }
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
            <Text style={S.pageTitle}>Dashboard</Text>
            <Text style={S.pageSub}>Trusted Verified Layer</Text>
          </View>
        </View>

        {/* Pill toggle */}
        <View style={styles.pillRow}>
          {(['individual', 'business'] as const).map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.pill, audience === a && styles.pillActive]}
              onPress={() => setAudience(a)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.pillText,
                  audience === a && styles.pillTextActive,
                ]}
              >
                {a === 'individual' ? 'Individual' : 'Business'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {audience === 'individual' ? (
          <IndividualView
            bank={individualBank}
            onBank={setIndividualBank}
            onInvite={() => {
              setInviteKind('business')
              setInviteOpen(true)
            }}
          />
        ) : (
          <OrganizationView
            bank={businessBank}
            onBank={setBusinessBank}
            onInvite={() => {
              setInviteKind('individual')
              setInviteOpen(true)
            }}
          />
        )}
      </ScrollView>

      {/* Send invitation sheet */}
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
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Send invitation</Text>
              <ModalCloseButton onPress={() => setInviteOpen(false)} />
            </View>
            <Text style={styles.modalSub}>
              Send a sign-up link to{' '}
              {inviteKind === 'individual'
                ? 'an individual (NP, MA, admin, patient)'
                : 'an organization or another doctor'}
              . Once they sign up, they&apos;ll be linked to your{' '}
              {audience === 'individual' ? 'account' : 'business'}.
            </Text>

            <View style={styles.kindRow}>
              <TouchableOpacity
                style={[
                  styles.kindBtn,
                  inviteKind === 'individual' && styles.kindBtnActive,
                ]}
                onPress={() => setInviteKind('individual')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.kindText,
                    inviteKind === 'individual' && styles.kindTextActive,
                  ]}
                >
                  Individual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.kindBtn,
                  inviteKind === 'business' && styles.kindBtnActive,
                ]}
                onPress={() => setInviteKind('business')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.kindText,
                    inviteKind === 'business' && styles.kindTextActive,
                  ]}
                >
                  Organization
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  inviteMethod === 'sms' && styles.methodBtnActive,
                ]}
                onPress={() => setInviteMethod('sms')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.methodText,
                    inviteMethod === 'sms' && styles.methodTextActive,
                  ]}
                >
                  SMS (Twilio)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  inviteMethod === 'email' && styles.methodBtnActive,
                ]}
                onPress={() => setInviteMethod('email')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.methodText,
                    inviteMethod === 'email' && styles.methodTextActive,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={S.label}>
              {inviteMethod === 'sms' ? 'Mobile number' : 'Email address'}
            </Text>
            <TextInput
              style={S.input}
              placeholder={
                inviteMethod === 'sms' ? '(305) 555-0142' : 'name@example.com'
              }
              placeholderTextColor={COLORS.text3}
              value={inviteContact}
              onChangeText={setInviteContact}
              keyboardType={
                inviteMethod === 'sms' ? 'phone-pad' : 'email-address'
              }
              autoCapitalize="none"
            />

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
                {sending
                  ? 'Sending…'
                  : `Send ${inviteMethod === 'sms' ? 'SMS' : 'email'} invite`}
              </Text>
            </TouchableOpacity>
          </ModalCard>
          </ScrollView>
        </KeyboardAvoidingView>
        </ModalBackdrop>
      </Modal>
    </SafeAreaView>
  )
}

/* --------------------------------- Individual view --------------------------------- */

function IndividualView({
  bank,
  onBank,
  onInvite,
}: {
  bank: LinkedAccount | null
  onBank: (a: LinkedAccount) => void
  onInvite: () => void
}) {
  return (
    <>
      {/* Insurance card */}
      <View style={styles.insuranceCard}>
        <View style={styles.insuranceTop}>
          <Text style={styles.insuranceLabel}>HEALTH INSURANCE · PPO</Text>
          <View style={styles.verifiedPill}>
            <Text style={styles.verifiedText}>VERIFIED</Text>
          </View>
        </View>
        <Text style={styles.insuranceName}>MICHAEL DEHARO</Text>
        <Text style={styles.insuranceMember}>W123456789</Text>
        <View style={styles.insuranceBottom}>
          <View>
            <Text style={styles.insuranceKey}>GROUP</Text>
            <Text style={styles.insuranceVal}>0876421-MMG</Text>
          </View>
          <View>
            <Text style={styles.insuranceKey}>EFFECTIVE</Text>
            <Text style={styles.insuranceVal}>01 / 26</Text>
          </View>
          <View>
            <Text style={styles.insuranceKey}>RX BIN</Text>
            <Text style={styles.insuranceVal}>610502</Text>
          </View>
        </View>
      </View>

      {/* Send invitation */}
      <ActionCard
        title="Send invitation"
        body="Invite your doctor, a family member, or an organization to connect with you."
        cta="Send a link"
        onPress={onInvite}
      />

      {/* Bank account */}
      <Text style={S.sectionTitle}>Bank account</Text>
      <BankConnect
        account={bank}
        onConnected={onBank}
        helper="Used to schedule and pay future invoices. ConnecDNA does not store funds."
      />
    </>
  )
}

/* --------------------------------- Organization view --------------------------------- */

function OrganizationView({
  bank,
  onBank,
  onInvite,
}: {
  bank: LinkedAccount | null
  onBank: (a: LinkedAccount) => void
  onInvite: () => void
}) {
  return (
    <>
      {/* Org header */}
      <View style={styles.orgHero}>
        <Text style={styles.orgKicker}>YOUR BUSINESS</Text>
        <Text style={styles.orgName}>Miami Medical Group</Text>
        <Text style={styles.orgEntity}>
          {ORG_LOCATIONS.length} locations · {ORG_LOCATIONS.reduce((s, l) => s + l.patients, 0)} patients
        </Text>
      </View>

      {/* Locations */}
      <Text style={S.sectionTitle}>Locations</Text>
      {ORG_LOCATIONS.map((loc) => (
        <TouchableOpacity
          key={loc.id}
          style={styles.locationRow}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              loc.name,
              `${loc.address}\n${loc.patients} patients`
            )
          }
        >
          <View style={styles.locationDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationName}>{loc.name}</Text>
            <Text style={styles.locationAddress}>{loc.address}</Text>
          </View>
          <Text style={styles.locationCount}>{loc.patients}</Text>
        </TouchableOpacity>
      ))}

      {/* Personal ID + Business ID */}
      <Text style={[S.sectionTitle, { marginTop: SPACING.lg }]}>Identity</Text>
      <View style={styles.idCardsRow}>
        <View style={[styles.idCard, { backgroundColor: '#0f3a82' }]}>
          <Text style={styles.idLabel}>PERSONAL ID</Text>
          <Text style={styles.idNumber}>NPI 1234 5678 90</Text>
          <View style={styles.idBottom}>
            <Text style={styles.idHolder}>DR. M. DEHARO</Text>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          </View>
        </View>
        <View style={[styles.idCard, { backgroundColor: '#0f766e' }]}>
          <Text style={styles.idLabel}>BUSINESS ID</Text>
          <Text style={styles.idNumber}>EIN 12-3456789</Text>
          <View style={styles.idBottom}>
            <Text style={styles.idHolder}>MIAMI MEDICAL GROUP</Text>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Send invitation */}
      <View style={{ marginTop: SPACING.lg }}>
        <ActionCard
          title="Send invitation"
          body="Bring on a team member, partner doctor, or patient. Pick SMS or email — they get a sign-up link tied to your organization."
          cta="Send a link"
          onPress={onInvite}
        />
      </View>

      {/* Bank account */}
      <Text style={S.sectionTitle}>Bank account</Text>
      <BankConnect
        account={bank}
        onConnected={onBank}
        helper="Used for invoicing and credentialing payments. ConnecDNA does not store funds."
      />
    </>
  )
}

/* --------------------------------- Action card --------------------------------- */

function ActionCard({
  title,
  body,
  cta,
  onPress,
}: {
  title: string
  body: string
  cta: string
  onPress?: () => void
}) {
  return (
    <View style={styles.actionCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionBody}>{body}</Text>
      </View>
      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Text style={styles.actionBtnText}>{cta}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginTop: SPACING.md,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: COLORS.text,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text3,
  },
  pillTextActive: {
    color: COLORS.bg,
  },

  // Insurance card (individual)
  insuranceCard: {
    backgroundColor: '#0f3a82',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    minHeight: 200,
  },
  insuranceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  insuranceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.4,
  },
  insuranceName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: SPACING.lg,
  },
  insuranceMember: {
    fontFamily: 'Courier',
    color: 'rgba(255,255,255,0.92)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  insuranceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  insuranceKey: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  insuranceVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.4,
  },

  // Org hero
  orgHero: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border2,
    marginBottom: SPACING.md,
  },
  orgKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text3,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  orgName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  orgEntity: {
    fontSize: 12,
    color: COLORS.text2,
    marginTop: 2,
  },

  locationRow: {
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
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },
  locationName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  locationAddress: { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  locationCount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text2,
  },

  idCardsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  idCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.2,
  },
  idNumber: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Courier',
    letterSpacing: 1,
  },
  idBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  idHolder: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
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

  // Action card
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionBody: {
    fontSize: 12,
    color: COLORS.text2,
    lineHeight: 17,
  },
  actionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.text,
  },
  actionBtnText: {
    color: COLORS.bg,
    fontWeight: '800',
    fontSize: 12,
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
  modalSub: {
    fontSize: 13,
    color: COLORS.text2,
    lineHeight: 18,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalClose: {
    fontSize: 26,
    fontWeight: '300',
    color: COLORS.text3,
    paddingHorizontal: SPACING.sm,
  },
  kindRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  kindBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  kindBtnActive: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.indigo,
  },
  kindText: { fontSize: 13, color: COLORS.text3, fontWeight: '700' },
  kindTextActive: { color: COLORS.text },
  methodRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  methodText: { fontSize: 12, color: COLORS.text3, fontWeight: '700' },
  methodTextActive: { color: COLORS.bg },
})
