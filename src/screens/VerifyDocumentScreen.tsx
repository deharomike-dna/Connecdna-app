// VerifyDocumentScreen — mobile counterpart to the web VerifyRecordModal.
//
// Calls the SAME backend endpoint as the web app
// (`/api/employment-credential/intelligence/analyze`) via the shared
// `api.vecAnalyzeDocument()` adapter. Web and mobile share the same
// evidence ledger, the same anomaly checks, and the same Claude prompt
// version — there is no duplicate verification logic on the client.
//
// Three layers of work on this screen:
//   1. PICK   — let the user choose a document (image or PDF)
//   2. UPLOAD — push the file to Supabase storage at the bucket path
//                <userId>/vec-evidence/<recordType>/...
//   3. ANALYZE — call the shared API and render the structured result
//
// PICK + UPLOAD require dependencies the mobile project hasn't
// installed yet (`expo-image-picker`, `expo-file-system`, `expo-crypto`).
// The wiring below is parameterized so adding those deps is the only
// next step — no architectural change needed.

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { api, type VecAnalysis } from '../api/client'

type RecordType =
  | 'employment' | 'education' | 'credential'
  | 'reference' | 'affiliation' | 'identity'

const RECORD_TABLE: Record<RecordType, string> = {
  employment:  'vec_employment_records',
  education:   'vec_education_records',
  credential:  'vec_credentials',
  reference:   'vec_references',
  affiliation: 'vec_org_affiliations',
  identity:    'vec_professional_profiles',
}

const SEVERITY_TINT: Record<'low' | 'medium' | 'high' | 'critical', string> = {
  low:      '#7a808a',
  medium:   '#c19a3b',
  high:     '#c19a3b',
  critical: '#b8341a',
}

type PickedFile = {
  uri: string
  name: string
  mimeType: string
  // The SHA-256 hex of the file bytes (computed on-device).
  hashSha256: string
  // The bytes ready to upload — kept in memory until the upload completes.
  bytes: Uint8Array
}

type Props = {
  route: {
    params: {
      profileId: string
      recordType: RecordType
      recordId: string
      recordLabel: string  // e.g. "Operations Manager @ Northstar"
    }
  }
  navigation: { goBack: () => void }
}

export default function VerifyDocumentScreen({ route, navigation }: Props) {
  const { profileId, recordType, recordId, recordLabel } = route.params
  const [step, setStep] = useState<'idle' | 'uploading' | 'analyzing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null)
  const [analysis, setAnalysis] = useState<VecAnalysis | null>(null)

  // -------------------------------------------------------------------------
  // PICK — to be wired with expo-image-picker / expo-document-picker.
  //
  //   yarn add expo-image-picker expo-file-system expo-crypto
  //
  // The picker should populate a PickedFile via setPickedFile(). Once
  // a file is picked, this screen automatically uploads + analyzes.
  // -------------------------------------------------------------------------
  async function handlePick() {
    Alert.alert(
      'File picker not yet wired',
      'Run `npx expo install expo-image-picker expo-file-system expo-crypto` and replace this handler with a real picker. ' +
      'The rest of the upload → analyze pipeline below is functional once the picker returns a PickedFile.',
    )
  }

  // -------------------------------------------------------------------------
  // UPLOAD + ANALYZE — called once we have a PickedFile.
  // -------------------------------------------------------------------------
  async function handleAnalyze(file: PickedFile) {
    setErrorMsg(null)
    setAnalysis(null)
    setStep('uploading')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not signed in')

      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${session.user.id}/vec-evidence/${recordType}/${recordId}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('identity-documents')
        .upload(path, file.bytes.buffer as ArrayBuffer, {
          contentType: file.mimeType,
          upsert: true,
        })
      if (uploadErr) throw uploadErr

      // Load the record so Claude can cross-validate against the claim.
      const { data: claim, error: claimErr } = await supabase
        .from(RECORD_TABLE[recordType])
        .select('*')
        .eq('id', recordId)
        .single()
      if (claimErr || !claim) throw new Error('Could not load record')

      setStep('analyzing')
      const { analysis } = await api.vecAnalyzeDocument({
        profileId, recordType, recordId,
        documentStoragePath: path,
        documentMimeType:    file.mimeType,
        documentHashSha256:  file.hashSha256,
        claim:               claim as Record<string, unknown>,
      })

      setAnalysis(analysis)
      setStep('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed')
      setStep('error')
    }
  }

  // When the picker (once wired) sets a file, kick the analyze pipeline.
  React.useEffect(() => {
    if (pickedFile) void handleAnalyze(pickedFile)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedFile])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad}>
      <Text style={styles.eyebrow}>Verify document</Text>
      <Text style={styles.title}>{recordLabel}</Text>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Upload a document</Text>
        <Text style={styles.cardBody}>
          Photograph the document or pick a file. The image and its SHA-256
          hash are uploaded to ConnecDNA storage. Then Claude reads the
          document, extracts structured facts, and cross-validates them
          against your record claim. The analysis is one weighted evidence
          signal — final verification still comes from authoritative sources.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePick}>
          <Text style={styles.primaryBtnText}>
            {pickedFile ? 'Replace document' : 'Pick a document'}
          </Text>
        </TouchableOpacity>
      </View>

      {step === 'uploading' && (
        <View style={styles.statusCard}>
          <ActivityIndicator />
          <Text style={styles.statusText}>Uploading…</Text>
        </View>
      )}
      {step === 'analyzing' && (
        <View style={styles.statusCard}>
          <ActivityIndicator />
          <Text style={styles.statusText}>Reading the document and cross-validating…</Text>
        </View>
      )}
      {step === 'error' && errorMsg && (
        <View style={[styles.statusCard, styles.errorCard]}>
          <Text style={styles.errorText}>Failed: {errorMsg}</Text>
        </View>
      )}

      {analysis && <AnalysisPanel analysis={analysis} />}

      <TouchableOpacity style={styles.secondaryBtn} onPress={navigation.goBack}>
        <Text style={styles.secondaryBtnText}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function AnalysisPanel({ analysis }: { analysis: VecAnalysis }) {
  return (
    <View style={styles.analysis}>
      <Text style={styles.analysisHeader}>Document intelligence</Text>
      <Text style={styles.analysisMeta}>
        {analysis.model_version} · {analysis.prompt_version}
      </Text>

      <View style={styles.statsRow}>
        <Stat label="Detected" value={prettify(analysis.detected_document_type)} />
        <Stat label="Claim match" value={`${analysis.cross_validation.claim_match_score}/100`} />
        <Stat
          label="Δ"
          value={`${analysis.confidence_delta > 0 ? '+' : ''}${analysis.confidence_delta}`}
          tint={
            analysis.confidence_delta > 0
              ? '#7ea98a'
              : analysis.confidence_delta < 0
              ? '#b8341a'
              : '#7a808a'
          }
        />
      </View>

      <FieldsBlock fields={analysis.extracted_fields} />

      {analysis.cross_validation.agreements.length > 0 && (
        <BulletList label="Agreements" items={analysis.cross_validation.agreements} />
      )}

      {analysis.cross_validation.mismatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mismatches</Text>
          {analysis.cross_validation.mismatches.map((m, i) => (
            <View key={i} style={styles.mismatchRow}>
              <Text style={[styles.severityChip, { borderColor: SEVERITY_TINT[m.severity], color: SEVERITY_TINT[m.severity] }]}>
                {m.severity.toUpperCase()}
              </Text>
              <Text style={styles.mismatchText}>
                <Text style={styles.fieldName}>{m.field}: </Text>
                claimed “{m.claimed}” · observed “{m.observed}”
              </Text>
            </View>
          ))}
        </View>
      )}

      {analysis.anomalies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Anomalies</Text>
          {analysis.anomalies.map((a, i) => (
            <View key={i} style={styles.mismatchRow}>
              <Text style={[styles.severityChip, { borderColor: SEVERITY_TINT[a.severity], color: SEVERITY_TINT[a.severity] }]}>
                {a.severity.toUpperCase()}
              </Text>
              <Text style={styles.mismatchText}>
                <Text style={styles.fieldName}>{a.kind.replace(/_/g, ' ')}</Text> — {a.reason}
              </Text>
            </View>
          ))}
        </View>
      )}

      {analysis.recommended_sources.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recommended next sources</Text>
          <View style={styles.tagRow}>
            {analysis.recommended_sources.map((r, i) => (
              <Text key={i} style={styles.tag}>
                {r.adapter_kind}{r.vendor ? ` · ${r.vendor}` : ''}
              </Text>
            ))}
          </View>
        </View>
      )}

      {analysis.reasoning.length > 0 && <BulletList label="Reasoning" items={analysis.reasoning} />}

      <Text style={styles.footnote}>
        This analysis contributes one weighted evidence row. Verification status
        comes from the full trust engine, which combines this with payroll,
        HRIS, employer attestation, and source-of-truth lookups.
      </Text>
    </View>
  )
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tint ? { color: tint } : null]}>{value}</Text>
    </View>
  )
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {items.map((s, i) => (
        <Text key={i} style={styles.bullet}>• {s}</Text>
      ))}
    </View>
  )
}

function FieldsBlock({ fields }: { fields: Record<string, string | number | null> }) {
  const populated = Object.entries(fields).filter(([, v]) => v !== null && v !== '')
  if (populated.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Extracted fields</Text>
      {populated.map(([k, v]) => (
        <Text key={k} style={styles.field}>
          <Text style={styles.fieldName}>{k.replace(/_/g, ' ')}: </Text>
          {String(v)}
        </Text>
      ))}
    </View>
  )
}

function prettify(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1115' },
  scrollPad: { padding: 20, paddingBottom: 60 },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: '#7a808a', textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '600', color: '#f3f1ec', marginTop: 6 },
  card: { marginTop: 18, padding: 16, backgroundColor: '#171a20', borderColor: '#2a2f38', borderWidth: 1, borderRadius: 10 },
  cardHeader: { fontSize: 12, color: '#7a808a', letterSpacing: 1.4, textTransform: 'uppercase' },
  cardBody: { fontSize: 13, color: '#c5c7cb', lineHeight: 20, marginTop: 10 },
  primaryBtn: { marginTop: 14, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#b8341a', borderRadius: 6, alignItems: 'center' },
  primaryBtnText: { color: '#fff', letterSpacing: 1, fontSize: 12, textTransform: 'uppercase' },
  secondaryBtn: { marginTop: 22, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3a4150', borderRadius: 6 },
  secondaryBtnText: { color: '#c5c7cb', letterSpacing: 1, fontSize: 11, textTransform: 'uppercase' },
  statusCard: { marginTop: 14, padding: 14, backgroundColor: '#171a20', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorCard: { borderColor: '#b8341a', borderWidth: 1 },
  statusText: { color: '#c5c7cb', fontSize: 13, marginLeft: 8 },
  errorText: { color: '#c19a3b', fontSize: 13 },
  analysis: { marginTop: 18, padding: 16, backgroundColor: 'rgba(184, 52, 26, 0.10)', borderColor: 'rgba(184, 52, 26, 0.35)', borderWidth: 1, borderRadius: 10 },
  analysisHeader: { fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: '#7a808a' },
  analysisMeta: { fontSize: 10, color: '#5b606a', letterSpacing: 1, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 12 },
  stat: { flex: 1 },
  statLabel: { fontSize: 10, letterSpacing: 1, color: '#5b606a', textTransform: 'uppercase' },
  statValue: { fontSize: 16, color: '#f3f1ec', fontWeight: '600', marginTop: 4 },
  section: { marginTop: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.4, color: '#7a808a', textTransform: 'uppercase', marginBottom: 6 },
  bullet: { fontSize: 12, color: '#c5c7cb', lineHeight: 19 },
  mismatchRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' },
  severityChip: { fontSize: 9, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginRight: 8, marginTop: 2, letterSpacing: 1 },
  mismatchText: { flex: 1, fontSize: 12, color: '#c5c7cb', lineHeight: 18 },
  fieldName: { color: '#f3f1ec', fontWeight: '600' },
  field: { fontSize: 12, color: '#c5c7cb', marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 11, color: '#b8341a', borderColor: 'rgba(184, 52, 26, 0.35)', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' },
  footnote: { fontSize: 11, color: '#5b606a', marginTop: 14, lineHeight: 17 },
})
