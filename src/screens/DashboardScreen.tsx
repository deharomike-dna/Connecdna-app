// src/screens/DashboardScreen.tsx
// ConnecDNA Claims tab. Filter pills (Protected / Pending / Rejected),
// summary stats, list of claims with drill-in detail sheet, and a
// working bulk-Approve flow that walks T&C → Submit → confirmation.

import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'
import TwoFactorScreen from './TwoFactorScreen'
import { ModalBackdrop, ModalCard, ModalCloseButton } from '../components/ModalParts'

type ClaimStatus = 'protected' | 'pending' | 'rejected'

type Claim = {
  id: string
  patientName: string
  payer: string
  service: string
  amount: number
  status: ClaimStatus
  reason?: string // why pending or rejected
}

const ALL_CLAIMS: Claim[] = [
  { id: 'CL-1042', patientName: 'James Donovan',     payer: 'Aetna',  service: '99213 Office visit',     amount: 245,  status: 'protected' },
  { id: 'CL-1043', patientName: 'Marisol Ramirez',   payer: 'BCBS',   service: '99214 Office visit',     amount: 312,  status: 'protected' },
  { id: 'CL-1044', patientName: 'Anita Singh',       payer: 'Cigna',  service: '93000 ECG, 12-lead',     amount: 88,   status: 'protected' },
  { id: 'CL-1045', patientName: 'Linda Martinez',    payer: 'Aetna',  service: '99396 Preventive',       amount: 196,  status: 'pending', reason: 'Awaiting prior authorization' },
  { id: 'CL-1046', patientName: 'Robert Thompson',   payer: 'UHC',    service: '90832 Psychotherapy',    amount: 130,  status: 'pending', reason: 'Verifying provider eligibility' },
  { id: 'CL-1047', patientName: 'Priya Krishnan',    payer: 'Humana', service: '99203 New patient',      amount: 220,  status: 'rejected', reason: 'Diagnosis code mismatch' },
]

const FILTERS: { key: 'all' | ClaimStatus; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'protected', label: 'Protected' },
  { key: 'pending',   label: 'Pending' },
  { key: 'rejected',  label: 'Rejected' },
]

function statusMeta(s: ClaimStatus) {
  if (s === 'protected') return { label: 'PROTECTED', color: COLORS.green, soft: COLORS.greenSoft }
  if (s === 'pending')   return { label: 'PENDING',   color: COLORS.amber, soft: COLORS.amberSoft }
  return                       { label: 'REJECTED',  color: COLORS.red,   soft: COLORS.redSoft }
}

export default function DashboardScreen() {
  const [filter, setFilter] = useState<'all' | ClaimStatus>('all')
  const [selected, setSelected] = useState<Claim | null>(null)
  const [tcOpen, setTcOpen] = useState(false)
  const [tcAccepted, setTcAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // 2FA gate before final submission
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)
  // Pending action awaiting 2FA. Either bulk submit or single approve.
  const [pendingAction, setPendingAction] =
    useState<{ kind: 'bulk' } | { kind: 'single'; claim: Claim } | null>(null)

  const counts = useMemo(() => ({
    protected: ALL_CLAIMS.filter((c) => c.status === 'protected').length,
    pending:   ALL_CLAIMS.filter((c) => c.status === 'pending').length,
    rejected:  ALL_CLAIMS.filter((c) => c.status === 'rejected').length,
    total:     ALL_CLAIMS.length,
  }), [])

  const totalAmount = useMemo(
    () => ALL_CLAIMS.reduce((sum, c) => sum + c.amount, 0),
    []
  )

  const visible = useMemo(
    () => filter === 'all' ? ALL_CLAIMS : ALL_CLAIMS.filter((c) => c.status === filter),
    [filter]
  )

  const openApprove = () => {
    setTcAccepted(false)
    setTcOpen(true)
  }

  // After T&C is accepted, switch from T&C modal to 2FA gate before submitting.
  const continueToTwoFactor = () => {
    if (!tcAccepted) return
    setTcOpen(false)
    setPendingAction({ kind: 'bulk' })
    setTwoFactorOpen(true)
  }

  // 2FA succeeded — actually submit (bulk or single).
  const onTwoFactorVerified = () => {
    setTwoFactorOpen(false)
    if (!pendingAction) return
    if (pendingAction.kind === 'bulk') {
      setSubmitting(true)
      setTimeout(() => {
        setSubmitting(false)
        Alert.alert(
          'Submitted',
          `${counts.protected} protected claims submitted to clearinghouse.`
        )
      }, 600)
    } else {
      const claim = pendingAction.claim
      Alert.alert('Approved & submitted', `${claim.id} (${claim.patientName}) approved and submitted.`)
      setSelected(null)
    }
    setPendingAction(null)
  }

  // Per-claim approve also requires 2FA before submission.
  const approveOne = (claim: Claim) => {
    setPendingAction({ kind: 'single', claim })
    setTwoFactorOpen(true)
  }
  const rejectOne = (claim: Claim) => {
    Alert.alert('Rejected', `${claim.id} (${claim.patientName}) rejected.`)
    setSelected(null)
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <View style={S.spaceBetween}>
          <View>
            <Text style={S.pageTitle}>Claims</Text>
            <Text style={S.pageSub}>
              {counts.total} on this batch · ${totalAmount.toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Text style={styles.iconGlyph}>⌕</Text>
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
        {/* Stats */}
        <View style={S.statGrid}>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: COLORS.green }]}>{counts.protected}</Text>
            <Text style={S.statLbl}>Protected</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: COLORS.amber }]}>{counts.pending}</Text>
            <Text style={S.statLbl}>Pending</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: COLORS.red }]}>{counts.rejected}</Text>
            <Text style={S.statLbl}>Rejected</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: COLORS.text }]}>${totalAmount.toLocaleString()}</Text>
            <Text style={S.statLbl}>Batch total</Text>
          </View>
        </View>

        {/* Approve protected — opens T&C → Submit flow */}
        <TouchableOpacity
          style={[
            S.btnPrimary,
            { marginBottom: SPACING.lg, opacity: counts.protected === 0 ? 0.5 : 1 },
          ]}
          onPress={openApprove}
          disabled={counts.protected === 0}
          activeOpacity={0.85}
        >
          <Text style={S.btnPrimaryText}>
            Approve protected claims ({counts.protected})
          </Text>
        </TouchableOpacity>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const count =
              f.key === 'all' ? counts.total :
              f.key === 'protected' ? counts.protected :
              f.key === 'pending' ? counts.pending : counts.rejected
            const active = filter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filter, active && styles.filterActive]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {f.label} · {count}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Claims list */}
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No claims in this filter.</Text>
          </View>
        ) : (
          visible.map((c) => {
            const meta = statusMeta(c.status)
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.row}
                onPress={() => setSelected(c)}
                activeOpacity={0.85}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowId}>
                    {c.id} · {c.patientName}
                  </Text>
                  <Text style={styles.rowSvc} numberOfLines={1}>
                    {c.service} · {c.payer}
                  </Text>
                  {c.reason && (
                    <Text style={styles.rowReason} numberOfLines={1}>
                      {c.reason}
                    </Text>
                  )}
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmt}>${c.amount}</Text>
                  <View
                    style={[styles.statusPill, { backgroundColor: meta.soft }]}
                  >
                    <Text style={[styles.statusText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* T&C → Submit modal */}
      <Modal
        visible={tcOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTcOpen(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <ModalBackdrop onClose={() => setTcOpen(false)} style={{ justifyContent: 'flex-end' }}>
          <ModalCard style={styles.modalCard}>
            <View style={S.spaceBetween}>
              <Text style={styles.modalTitle}>Approve & submit</Text>
              <ModalCloseButton onPress={() => setTcOpen(false)} />
            </View>

            <Text style={styles.modalSub}>
              You are about to submit {counts.protected} protected claims
              totaling{' '}
              ${
                ALL_CLAIMS
                  .filter((c) => c.status === 'protected')
                  .reduce((s, c) => s + c.amount, 0)
                  .toLocaleString()
              }{' '}
              to the clearinghouse. Once submitted, claims cannot be retracted
              automatically.
            </Text>

            <ScrollView
              style={styles.tcBox}
              contentContainerStyle={{ padding: SPACING.md }}
            >
              <Text style={styles.tcText}>
                By submitting, I attest that each claim has been reviewed for
                medical necessity and accurate coding, that the rendering
                provider holds active credentials, and that all required
                documentation is on file. I understand that submission of false
                or misleading claims may result in civil and criminal
                penalties under applicable federal and state law.{'\n\n'}
                ConnecDNA verifies provider identity, payer eligibility, and
                permission state at time of submission. Verification does not
                replace clinical judgment, payer rules, or official billing
                system requirements.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.tcAgree}
              onPress={() => setTcAccepted((v) => !v)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  tcAccepted && styles.checkboxChecked,
                ]}
              >
                {tcAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.tcAgreeText}>
                I have read and agree to the submission terms above.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                S.btnPrimary,
                { opacity: tcAccepted ? 1 : 0.5 },
              ]}
              onPress={continueToTwoFactor}
              disabled={!tcAccepted}
              activeOpacity={0.85}
            >
              <Text style={S.btnPrimaryText}>Continue · verify with code</Text>
            </TouchableOpacity>
          </ModalCard>
        </ModalBackdrop>
      </Modal>

      {/* Claim detail sheet */}
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
                {selected ? `${selected.id}` : ''}
              </Text>
              <ModalCloseButton onPress={() => setSelected(null)} />
            </View>

            {selected && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Patient</Text>
                  <Text style={styles.detailVal}>{selected.patientName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Service</Text>
                  <Text style={styles.detailVal}>{selected.service}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Payer</Text>
                  <Text style={styles.detailVal}>{selected.payer}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Amount</Text>
                  <Text style={styles.detailVal}>${selected.amount}</Text>
                </View>
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
                {selected.reason && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Reason</Text>
                    <Text style={styles.detailVal}>{selected.reason}</Text>
                  </View>
                )}

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.actBtnGhost}
                    onPress={() => rejectOne(selected)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actBtnGhostText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.btnPrimary, { flex: 1 }]}
                    onPress={() => approveOne(selected)}
                    activeOpacity={0.85}
                  >
                    <Text style={S.btnPrimaryText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ModalCard>
        </ModalBackdrop>
      </Modal>

      {/* 2FA gate before submission */}
      <Modal
        visible={twoFactorOpen}
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => {
          setTwoFactorOpen(false)
          setPendingAction(null)
        }}
      >
        <TwoFactorScreen
          mode="submit"
          phoneHint="***42"
          onVerified={onTwoFactorVerified}
          onCancel={() => {
            setTwoFactorOpen(false)
            setPendingAction(null)
          }}
        />
      </Modal>

      {/* Submitting overlay (shown after 2FA succeeds, while bulk submit fires) */}
      {submitting && (
        <View style={styles.submittingOverlay}>
          <View style={styles.submittingCard}>
            <ActivityIndicator color={COLORS.indigo} />
            <Text style={styles.submittingText}>Submitting claims…</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontSize: 18, color: COLORS.text2 },

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
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text3,
  },
  filterTextActive: {
    color: COLORS.text,
  },

  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  rowId: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  rowSvc: { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  rowReason: { fontSize: 11, color: COLORS.amber, marginTop: 2, fontWeight: '700' },
  rowAmt: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.text3,
    fontSize: 13,
  },

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
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
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
  tcBox: {
    maxHeight: 180,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  tcText: {
    fontSize: 12,
    color: COLORS.text2,
    lineHeight: 18,
  },
  tcAgree: {
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
  tcAgreeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text2,
    lineHeight: 17,
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
    borderColor: COLORS.red,
  },
  actBtnGhostText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '800',
  },

  submittingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border2,
  },
  submittingText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
})
