// src/screens/WorkspaceScreen.tsx
// ConnecDNA Workspace = outside connected relationships (legal, banking,
// vendors, partnerships, vertical doctors, accounting). Per-connection
// detail with three actions: share doc, view shared docs, internal chat.

import React, { useMemo, useState } from 'react'
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
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, S, SPACING, RADIUS } from '../theme'
import { ModalBackdrop, ModalCard, ModalCloseButton, ModalBackButton } from '../components/ModalParts'

type ConnectionGroup = 'legal' | 'banking' | 'vendors' | 'partnerships' | 'vertical' | 'accounting'

type Connection = {
  id: string
  name: string
  org: string
  group: ConnectionGroup
  initials: string
  unreadMessages?: number
  sharedDocs: number
}

type RoomFeatures = {
  sharedDocs: boolean
  privateChat: boolean
  linkedAccounts: boolean
}

type Room = {
  id: string
  name: string
  participantIds: string[]   // existing connection IDs only
  features: RoomFeatures
  unreadMessages?: number
  lastSnippet?: string
}

type Attachment = {
  id: string
  name: string
  kind: 'photo' | 'file'
}

type ChatMessage = {
  id: string
  from: 'me' | 'them'
  text: string
  time: string
  attachments?: Attachment[]
}

const CONNECTIONS: Connection[] = [
  { id: '1', name: 'Sarah Chen, Esq.',  org: 'Chen & Patel LLP',           group: 'legal',         initials: 'SC', unreadMessages: 2, sharedDocs: 4 },
  { id: '2', name: 'David Kim',          org: 'First Florida Bank',         group: 'banking',       initials: 'DK', sharedDocs: 1 },
  { id: '3', name: 'Henley Medical',     org: 'Equipment Vendor',           group: 'vendors',       initials: 'HM', sharedDocs: 6 },
  { id: '4', name: 'Dr. Priya Patel',    org: 'Patel Imaging · Radiology',  group: 'vertical',      initials: 'PP', unreadMessages: 1, sharedDocs: 12 },
  { id: '5', name: 'Dr. Carlos Vega',    org: 'Vega Cardiology',            group: 'vertical',      initials: 'CV', sharedDocs: 8 },
  { id: '6', name: 'Lewis & Co. CPAs',   org: 'Practice accountant',        group: 'accounting',    initials: 'LC', sharedDocs: 3 },
  { id: '7', name: 'Bayside Pharmacy',   org: 'Preferred fulfillment',      group: 'partnerships',  initials: 'BP', sharedDocs: 2 },
]

const GROUPS: { key: ConnectionGroup; title: string }[] = [
  { key: 'vertical',     title: 'Vertical providers' },
  { key: 'partnerships', title: 'Partnerships' },
  { key: 'legal',        title: 'Legal' },
  { key: 'banking',      title: 'Banking' },
  { key: 'accounting',   title: 'Accounting' },
  { key: 'vendors',      title: 'Vendors' },
]

const STARTER_CHAT: ChatMessage[] = [
  { id: '1', from: 'them', text: 'I sent over the imaging report for Patient L.M.', time: '9:14' },
  { id: '2', from: 'me',   text: 'Got it. Reviewing now.',                            time: '9:16' },
  { id: '3', from: 'them', text: 'Let me know if you want a follow-up scan.',          time: '9:18' },
]

function FeatureToggle({
  label,
  helper,
  value,
  onValueChange,
  isLast,
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
        styles.featureRow,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.featureLabel}>{label}</Text>
        <Text style={styles.featureHelper}>{helper}</Text>
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

function ChatComposer({
  draft,
  setDraft,
  attachments,
  onRemoveAttachment,
  onAttach,
  onSend,
}: {
  draft: string
  setDraft: (s: string) => void
  attachments: Attachment[]
  onRemoveAttachment: (id: string) => void
  onAttach: () => void
  onSend: () => void
}) {
  return (
    <View>
      {attachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {attachments.map((a) => (
            <View key={a.id} style={styles.chip}>
              <Text style={styles.chipGlyph}>
                {a.kind === 'photo' ? '▢' : '▤'}
              </Text>
              <Text style={styles.chipText} numberOfLines={1}>
                {a.name}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveAttachment(a.id)}
                hitSlop={8}
                style={styles.chipRemove}
              >
                <Text style={styles.chipRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.composer}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={onAttach}
          activeOpacity={0.85}
          hitSlop={8}
        >
          <Text style={styles.attachBtnText}>＋</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.composerInput}
          placeholder="Message"
          placeholderTextColor={COLORS.text3}
          value={draft}
          onChangeText={setDraft}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { opacity: draft.trim() || attachments.length ? 1 : 0.5 },
          ]}
          onPress={onSend}
          disabled={!draft.trim() && attachments.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function WorkspaceScreen() {
  const [selected, setSelected] = useState<Connection | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>(STARTER_CHAT)
  const [draft, setDraft] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [attachOpen, setAttachOpen] = useState(false)

  // Multi-party rooms
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 'r-1',
      name: 'Patient L.M. care team',
      participantIds: ['1', '4'],
      features: { sharedDocs: true, privateChat: true, linkedAccounts: false },
      unreadMessages: 1,
      lastSnippet: 'Reviewing the imaging report now.',
    },
  ])
  const [newRoomOpen, setNewRoomOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomSelectedIds, setNewRoomSelectedIds] = useState<string[]>([])
  const [newRoomFeatures, setNewRoomFeatures] = useState<RoomFeatures>({
    sharedDocs: false,
    privateChat: false,
    linkedAccounts: false,
  })
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [roomChatOpen, setRoomChatOpen] = useState(false)

  const grouped = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        items: CONNECTIONS.filter((c) => c.group === g.key),
      })).filter((g) => g.items.length > 0),
    []
  )

  const toggleRoomMember = (id: string) => {
    setNewRoomSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const createRoom = () => {
    if (!newRoomName.trim()) {
      Alert.alert('Name required', 'Give the room a short name.')
      return
    }
    if (newRoomSelectedIds.length === 0) {
      Alert.alert('Pick at least one participant', 'Select existing connections from your workspace.')
      return
    }
    const newRoom: Room = {
      id: `r-${Date.now()}`,
      name: newRoomName.trim(),
      participantIds: newRoomSelectedIds,
      features: newRoomFeatures,
    }
    setRooms((prev) => [newRoom, ...prev])
    setNewRoomOpen(false)
    setNewRoomName('')
    setNewRoomSelectedIds([])
    setNewRoomFeatures({ sharedDocs: false, privateChat: false, linkedAccounts: false })

    const enabled = [
      newRoomFeatures.sharedDocs    && 'shared docs',
      newRoomFeatures.privateChat   && 'private chat',
      newRoomFeatures.linkedAccounts && 'linked accounts',
    ].filter(Boolean) as string[]
    Alert.alert(
      'Room created',
      enabled.length > 0
        ? `Room ready with: ${enabled.join(', ')}. Participants are notified in the app.`
        : 'Room ready. Enable features anytime from the room settings.'
    )
  }

  const openRoomChat = (room: Room) => {
    setActiveRoom(room)
    setRoomChatOpen(true)
  }

  const sendDraft = () => {
    if (!draft.trim() && pendingAttachments.length === 0) return
    setChat((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        from: 'me',
        text: draft.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
      },
    ])
    setDraft('')
    setPendingAttachments([])
    // TODO: backend upload — see BACKEND_TODO.md (POST /api/uploads).
    // Once attachments have real fileUrls, send the message + URLs to
    // the room's message endpoint instead of just appending locally.
  }

  const pickAttachment = (kind: 'photo' | 'file') => {
    setAttachOpen(false)
    // TODO: integrate expo-image-picker (photos) and expo-document-picker (files)
    // when the user installs those packages and you wire upload bytes to backend.
    // For now we add a placeholder chip so the UX flow is testable end-to-end.
    const stamp = Date.now().toString(36).toUpperCase()
    const fakeName =
      kind === 'photo' ? `IMG_${stamp}.jpg` : `Doc_${stamp}.pdf`
    setPendingAttachments((prev) => [
      ...prev,
      { id: stamp, name: fakeName, kind },
    ])
  }

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}>
        <View style={S.spaceBetween}>
          <View>
            <Text style={S.pageTitle}>Workspace</Text>
            <Text style={S.pageSub}>
              {CONNECTIONS.length} connections · {CONNECTIONS.reduce((s, c) => s + (c.unreadMessages ?? 0), 0)} unread
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => setNewRoomOpen(true)}
          >
            <Text style={styles.addBtnText}>+ New room</Text>
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
        {/* Rooms (multi-party group chats) */}
        {rooms.length > 0 && (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={S.sectionTitle}>Rooms</Text>
            {rooms.map((r) => {
              const participantCount = r.participantIds.length
              const features = [
                r.features.sharedDocs    && 'docs',
                r.features.privateChat   && 'chat',
                r.features.linkedAccounts && 'accounts',
              ].filter(Boolean) as string[]
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.row}
                  activeOpacity={0.85}
                  onPress={() => openRoomChat(r)}
                >
                  <View style={[styles.avatar, { backgroundColor: COLORS.indigo }]}>
                    <Text style={[styles.avatarText, { color: COLORS.white }]}>#</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{r.name}</Text>
                    <Text style={styles.org}>
                      {participantCount} participants
                      {features.length > 0 ? ` · ${features.join(', ')}` : ''}
                    </Text>
                  </View>
                  {r.unreadMessages ? (
                    <View style={styles.unreadDot}>
                      <Text style={styles.unreadText}>{r.unreadMessages}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {grouped.map((g) => (
          <View key={g.key} style={{ marginBottom: SPACING.lg }}>
            <Text style={S.sectionTitle}>{g.title}</Text>
            {g.items.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.row}
                onPress={() => setSelected(c)}
                activeOpacity={0.85}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{c.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.org}>{c.org}</Text>
                </View>
                <View style={styles.rowRight}>
                  {c.unreadMessages ? (
                    <View style={styles.unreadDot}>
                      <Text style={styles.unreadText}>{c.unreadMessages}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.docsText}>{c.sharedDocs} docs</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Connection detail sheet */}
      <Modal
        visible={selected !== null && !chatOpen && !docsOpen && !shareOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <ModalBackdrop onClose={() => setSelected(null)} style={{ justifyContent: 'flex-end' }}>
          <ModalCard style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={S.spaceBetween}>
              <Text style={styles.modalTitle}>{selected?.name ?? ''}</Text>
              <ModalCloseButton onPress={() => setSelected(null)} />
            </View>
            <Text style={styles.modalSub}>{selected?.org ?? ''}</Text>

            {/* Action tiles */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionTile}
                activeOpacity={0.85}
                onPress={() => setShareOpen(true)}
              >
                <Text style={styles.actionGlyph}>↗</Text>
                <Text style={styles.actionLabel}>Share doc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionTile}
                activeOpacity={0.85}
                onPress={() => setDocsOpen(true)}
              >
                <Text style={styles.actionGlyph}>▤</Text>
                <Text style={styles.actionLabel}>View docs</Text>
                <Text style={styles.actionMeta}>
                  {selected?.sharedDocs ?? 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionTile}
                activeOpacity={0.85}
                onPress={() => setChatOpen(true)}
              >
                <Text style={styles.actionGlyph}>✎</Text>
                <Text style={styles.actionLabel}>Chat</Text>
                {selected?.unreadMessages ? (
                  <Text style={[styles.actionMeta, { color: COLORS.indigo }]}>
                    {selected.unreadMessages}
                  </Text>
                ) : null}
              </TouchableOpacity>
            </View>

            {/* History */}
            <Text style={[S.sectionTitle, { marginTop: SPACING.lg }]}>
              Recent activity
            </Text>
            <ScrollView style={{ maxHeight: 240 }}>
              {[
                { kind: 'message',  who: selected?.name ?? '',  text: 'Sent imaging report for Patient L.M.', when: 'Today · 9:14' },
                { kind: 'doc',      who: selected?.name ?? '',  text: 'Shared Patient L.M. — imaging report.pdf',  when: 'Today · 9:12' },
                { kind: 'message',  who: 'You',                 text: 'Got it. Reviewing now.',                    when: 'Today · 9:16' },
                { kind: 'doc',      who: 'You',                 text: 'Shared Q1 referrals.xlsx',                  when: 'Apr 28 · 14:02' },
                { kind: 'account',  who: 'System',              text: 'Account linked for future transactions',    when: 'Apr 12 · 11:30' },
                { kind: 'message',  who: selected?.name ?? '',  text: 'BAA agreement signed.',                     when: 'Apr 12 · 10:55' },
              ].map((item, i) => (
                <View key={i} style={styles.historyRow}>
                  <View
                    style={[
                      styles.historyDot,
                      item.kind === 'doc'     && { backgroundColor: COLORS.amber },
                      item.kind === 'account' && { backgroundColor: COLORS.green },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyText}>
                      <Text style={styles.historyWho}>{item.who}: </Text>
                      {item.text}
                    </Text>
                    <Text style={styles.historyWhen}>{item.when}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.modalFooter}>
              Messages and shared documents are private to this connection.
            </Text>
          </ModalCard>
        </ModalBackdrop>
      </Modal>

      {/* Internal chat — KeyboardAvoidingView wraps everything so the
          composer stays above the keyboard on both iOS and Android. */}
      <Modal
        visible={chatOpen}
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setChatOpen(false)}
      >
        <SafeAreaView style={S.screen} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            style={{ flex: 1 }}
          >
            <View style={styles.chatHeader}>
              <ModalBackButton onPress={() => setChatOpen(false)} />
              <Text style={styles.chatTitle}>{selected?.name ?? ''}</Text>
              <View style={{ width: 64 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: SPACING.lg }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {chat.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    m.from === 'me' ? styles.bubbleMe : styles.bubbleThem,
                  ]}
                >
                  {m.text.length > 0 && (
                    <Text
                      style={
                        m.from === 'me' ? styles.bubbleTextMe : styles.bubbleText
                      }
                    >
                      {m.text}
                    </Text>
                  )}
                  {m.attachments?.map((a) => (
                    <View
                      key={a.id}
                      style={[
                        styles.bubbleAttachment,
                        m.from === 'me' && styles.bubbleAttachmentMe,
                      ]}
                    >
                      <Text style={[styles.chipGlyph, m.from === 'me' && { color: COLORS.white }]}>
                        {a.kind === 'photo' ? '▢' : '▤'}
                      </Text>
                      <Text
                        style={[
                          styles.chipText,
                          m.from === 'me' && { color: COLORS.white },
                        ]}
                        numberOfLines={1}
                      >
                        {a.name}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.bubbleTime}>{m.time}</Text>
                </View>
              ))}
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.composerSafe}>
              <ChatComposer
                draft={draft}
                setDraft={setDraft}
                attachments={pendingAttachments}
                onRemoveAttachment={removeAttachment}
                onAttach={() => setAttachOpen(true)}
                onSend={sendDraft}
              />
            </SafeAreaView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Shared docs list */}
      <Modal
        visible={docsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDocsOpen(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <ModalBackdrop onClose={() => setDocsOpen(false)} style={{ justifyContent: 'flex-end' }}>
          <ModalCard style={styles.modalCard}>
            <View style={S.spaceBetween}>
              <Text style={styles.modalTitle}>Shared documents</Text>
              <ModalCloseButton onPress={() => setDocsOpen(false)} />
            </View>
            {[
              { n: 'Patient L.M. — imaging report.pdf', d: 'May 4 · from them' },
              { n: 'Q1 referrals.xlsx',                d: 'Apr 28 · shared' },
              { n: 'BAA agreement v3.pdf',             d: 'Apr 12 · signed' },
            ].map((doc, i) => (
              <View key={i} style={styles.docRow}>
                <Text style={styles.docName}>{doc.n}</Text>
                <Text style={styles.docMeta}>{doc.d}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[S.btnSecondary, { marginTop: SPACING.md }]}
              activeOpacity={0.85}
              onPress={() => Alert.alert('Coming soon', 'Document upload.')}
            >
              <Text style={S.btnSecondaryText}>Upload a document</Text>
            </TouchableOpacity>
          </ModalCard>
        </ModalBackdrop>
      </Modal>

      {/* Room chat (multi-party group chat) */}
      <Modal
        visible={roomChatOpen}
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setRoomChatOpen(false)}
      >
        <SafeAreaView style={S.screen} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.chatHeader}>
              <ModalBackButton onPress={() => setRoomChatOpen(false)} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.chatTitle}>{activeRoom?.name ?? ''}</Text>
                {activeRoom && (
                  <Text style={{ fontSize: 11, color: COLORS.text3 }}>
                    {activeRoom.participantIds.length} participants
                  </Text>
                )}
              </View>
              <View style={{ width: 64 }} />
            </View>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: SPACING.lg }}
              keyboardShouldPersistTaps="handled"
            >
              {chat.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    m.from === 'me' ? styles.bubbleMe : styles.bubbleThem,
                  ]}
                >
                  {m.text.length > 0 && (
                    <Text
                      style={
                        m.from === 'me' ? styles.bubbleTextMe : styles.bubbleText
                      }
                    >
                      {m.text}
                    </Text>
                  )}
                  {m.attachments?.map((a) => (
                    <View
                      key={a.id}
                      style={[
                        styles.bubbleAttachment,
                        m.from === 'me' && styles.bubbleAttachmentMe,
                      ]}
                    >
                      <Text style={[styles.chipGlyph, m.from === 'me' && { color: COLORS.white }]}>
                        {a.kind === 'photo' ? '▢' : '▤'}
                      </Text>
                      <Text
                        style={[
                          styles.chipText,
                          m.from === 'me' && { color: COLORS.white },
                        ]}
                        numberOfLines={1}
                      >
                        {a.name}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.bubbleTime}>{m.time}</Text>
                </View>
              ))}
            </ScrollView>
            <SafeAreaView edges={['bottom']} style={styles.composerSafe}>
              <ChatComposer
                draft={draft}
                setDraft={setDraft}
                attachments={pendingAttachments}
                onRemoveAttachment={removeAttachment}
                onAttach={() => setAttachOpen(true)}
                onSend={sendDraft}
              />
            </SafeAreaView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Attachment picker action sheet (shared by 1:1 and room chats) */}
      <Modal
        visible={attachOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setAttachOpen(false)}
          style={styles.attachBackdrop}
        >
          <View style={styles.attachSheet}>
            <Text style={styles.attachTitle}>Add to message</Text>
            <TouchableOpacity
              style={styles.attachOption}
              onPress={() => pickAttachment('photo')}
              activeOpacity={0.85}
            >
              <View style={styles.attachIcon}><Text style={styles.attachGlyph}>▢</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachLabel}>Photo</Text>
                <Text style={styles.attachHelper}>Take a photo or pick from your library.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachOption}
              onPress={() => pickAttachment('file')}
              activeOpacity={0.85}
            >
              <View style={styles.attachIcon}><Text style={styles.attachGlyph}>▤</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachLabel}>File</Text>
                <Text style={styles.attachHelper}>PDF, doc, spreadsheet, or any file.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachCancel}
              onPress={() => setAttachOpen(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.attachCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New room sheet */}
      <Modal
        visible={newRoomOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNewRoomOpen(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <ModalBackdrop onClose={() => setNewRoomOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <ModalCard style={[styles.modalCard, { maxHeight: '88%' }]}>
              <View style={S.spaceBetween}>
                <Text style={styles.modalTitle}>New room</Text>
                <ModalCloseButton onPress={() => setNewRoomOpen(false)} />
              </View>
              <Text style={styles.modalSub}>
                Multi-party space with optional shared features. Pick people
                from your existing connections — invitations and connectivity
                happen inside the app and web dashboard.
              </Text>

              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={S.label}>Room name</Text>
                <TextInput
                  style={S.input}
                  placeholder="e.g. Patient L.M. care team"
                  placeholderTextColor={COLORS.text3}
                  value={newRoomName}
                  onChangeText={setNewRoomName}
                />

                {/* Feature toggles — all optional */}
                <Text style={[S.label, { marginTop: SPACING.md }]}>
                  Room features (all optional)
                </Text>
                <View style={styles.featureCard}>
                  <FeatureToggle
                    label="Shared docs"
                    helper="Members can upload and view documents in this room."
                    value={newRoomFeatures.sharedDocs}
                    onValueChange={(v) =>
                      setNewRoomFeatures((p) => ({ ...p, sharedDocs: v }))
                    }
                  />
                  <FeatureToggle
                    label="Private chat"
                    helper="Threaded internal messaging, end-to-end private to participants."
                    value={newRoomFeatures.privateChat}
                    onValueChange={(v) =>
                      setNewRoomFeatures((p) => ({ ...p, privateChat: v }))
                    }
                  />
                  <FeatureToggle
                    label="Linked accounts"
                    helper="Connect bank accounts inside the room for future transactions between members."
                    value={newRoomFeatures.linkedAccounts}
                    onValueChange={(v) =>
                      setNewRoomFeatures((p) => ({ ...p, linkedAccounts: v }))
                    }
                    isLast
                  />
                </View>

                <Text style={[S.label, { marginTop: SPACING.md }]}>
                  Add from your connections
                </Text>
                {CONNECTIONS.map((c) => {
                  const active = newRoomSelectedIds.includes(c.id)
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.pickRow,
                        active && styles.pickRowActive,
                      ]}
                      onPress={() => toggleRoomMember(c.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.pickAvatar}>
                        <Text style={styles.pickAvatarText}>{c.initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickName}>{c.name}</Text>
                        <Text style={styles.pickOrg}>{c.org}</Text>
                      </View>
                      <View
                        style={[
                          styles.pickCheck,
                          active && styles.pickCheckActive,
                        ]}
                      >
                        {active && <Text style={styles.pickCheckMark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  )
                })}

                <TouchableOpacity
                  style={[S.btnPrimary, { marginTop: SPACING.lg }]}
                  onPress={createRoom}
                  activeOpacity={0.85}
                >
                  <Text style={S.btnPrimaryText}>Create room</Text>
                </TouchableOpacity>
              </ScrollView>
            </ModalCard>
          </KeyboardAvoidingView>
        </ModalBackdrop>
      </Modal>

      {/* Quick share doc sheet */}
      <Modal
        visible={shareOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setShareOpen(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <ModalBackdrop onClose={() => setShareOpen(false)} style={{ justifyContent: 'flex-end' }}>
          <ModalCard style={styles.modalCard}>
            <View style={S.spaceBetween}>
              <Text style={styles.modalTitle}>Share a document</Text>
              <ModalCloseButton onPress={() => setShareOpen(false)} />
            </View>
            <Text style={styles.modalSub}>
              Pick a file from your device. The recipient will be notified
              and the document will appear under your shared docs with this
              connection.
            </Text>
            <TouchableOpacity
              style={S.btnPrimary}
              activeOpacity={0.85}
              onPress={() => {
                setShareOpen(false)
                Alert.alert('Sent', 'Document share dialog (stubbed).')
              }}
            >
              <Text style={S.btnPrimaryText}>Pick file & share</Text>
            </TouchableOpacity>
          </ModalCard>
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
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  org: { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  unreadDot: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  docsText: { fontSize: 11, color: COLORS.text3, fontWeight: '700' },

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
  modalSub: {
    fontSize: 13,
    color: COLORS.text2,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalFooter: {
    fontSize: 11,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  modalClose: {
    fontSize: 26,
    fontWeight: '300',
    color: COLORS.text3,
    paddingHorizontal: SPACING.sm,
  },

  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  actionTile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 6,
  },
  actionGlyph: { fontSize: 22, color: COLORS.indigo, fontWeight: '700' },
  actionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  actionMeta: { fontSize: 11, color: COLORS.text3 },

  docRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  docName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  docMeta: { fontSize: 11, color: COLORS.text3, marginTop: 2 },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatBack: { color: COLORS.indigo, fontSize: 16, fontWeight: '700' },
  chatBackHit: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 72,
    minHeight: 44,
    justifyContent: 'center',
  },
  chatTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, flex: 1, textAlign: 'center' },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 8,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.indigo,
    borderTopRightRadius: 4,
  },
  bubbleText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  bubbleTextMe: { color: COLORS.white, fontSize: 13, lineHeight: 18 },
  bubbleTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textAlign: 'right',
  },
  bubbleAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bubbleAttachmentMe: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.25)',
  },

  composerSafe: { backgroundColor: COLORS.bg },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  composerInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 110,
  },
  sendBtn: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  sendBtnText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '800',
  },

  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  pickRowActive: {
    borderColor: COLORS.indigo,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  pickAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickAvatarText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 12,
  },
  pickName: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  pickOrg: { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  pickCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickCheckActive: {
    backgroundColor: COLORS.indigo,
    borderColor: COLORS.indigo,
  },
  pickCheckMark: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.indigo,
    marginTop: 6,
  },
  historyText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  historyWho: {
    fontWeight: '800',
    color: COLORS.text2,
  },
  historyWhen: {
    fontSize: 11,
    color: COLORS.text3,
    marginTop: 2,
  },

  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: SPACING.md,
  },
  featureLabel: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  featureHelper: { fontSize: 11, color: COLORS.text3, marginTop: 2, lineHeight: 15 },

  // Composer attachments
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: -2,
  },
  chipRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 4,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border2,
    maxWidth: 200,
  },
  chipGlyph: { color: COLORS.text2, fontSize: 13, fontWeight: '700' },
  chipText: { color: COLORS.text, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  chipRemove: {
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  chipRemoveText: { color: COLORS.text2, fontSize: 13, fontWeight: '800', lineHeight: 14 },

  // Attachment picker sheet
  attachBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  attachSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderColor: COLORS.border2,
  },
  attachTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  attachOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachIcon: {
    width: 44, height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  attachGlyph: { color: COLORS.indigo, fontSize: 20, fontWeight: '700' },
  attachLabel: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  attachHelper: { color: COLORS.text3, fontSize: 11, marginTop: 2 },
  attachCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachCancelText: { color: COLORS.text2, fontSize: 14, fontWeight: '700' },
})
