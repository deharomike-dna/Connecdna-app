// src/legal/components/TransactionDisclosureBanner.tsx
//
// Persistent disclosure banner rendered above any screen that initiates or
// orchestrates a transaction, settlement, escrow-style flow, payment
// orchestration, or connected banking workflow. Mounting this component also
// records a transaction_disclosure_view row so the platform has evidence
// the disclosure was shown to the user.
//
// USAGE:
//   <TransactionDisclosureBanner workflowId="claim_123" workflowType="payment" />

import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, RADIUS } from '../../theme'
import { TRANSACTION_BANNER_TEXT, OPERATOR_ATTRIBUTION_SHORT } from '../disclosures'
import { recordTransactionDisclosureView } from '../acceptanceService'
import type { WorkflowType } from '../types'

interface Props {
  workflowId: string
  workflowType: WorkflowType
  organizationId?: string
  /** Optional override; defaults to the canonical short-form banner. */
  text?: string
}

export function TransactionDisclosureBanner({
  workflowId,
  workflowType,
  organizationId,
  text,
}: Props) {
  useEffect(() => {
    // Best-effort: a network failure here must not break the workflow UI.
    recordTransactionDisclosureView({ workflowId, workflowType, organizationId }).catch(
      () => undefined,
    )
  }, [workflowId, workflowType, organizationId])

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Non-custodial disclosure"
      style={styles.banner}
    >
      <Text style={styles.label}>NON-CUSTODIAL DISCLOSURE</Text>
      <Text style={styles.body}>{text ?? TRANSACTION_BANNER_TEXT}</Text>
      <Text style={styles.attribution}>{OPERATOR_ATTRIBUTION_SHORT}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  label: {
    color: COLORS.text3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  body: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
  attribution: {
    color: COLORS.text3,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 6,
  },
})
