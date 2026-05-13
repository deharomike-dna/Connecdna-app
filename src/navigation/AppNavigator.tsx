// src/navigation/AppNavigator.tsx
// Auth stack (Welcome → 2FA → CreateAccount) → role-routed bottom tabs.
// Org users see: Dashboard / Claims / Credentials / Workspace / More.
// Patient users see: Coverage / My care / More.

import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import WelcomeScreen from '../screens/WelcomeScreen'
import CreateAccountScreen from '../screens/CreateAccountScreen'
import TwoFactorScreen from '../screens/TwoFactorScreen'
import DashboardHomeScreen from '../screens/DashboardHomeScreen'
import DashboardScreen from '../screens/DashboardScreen'
import CardsScreen from '../screens/CardsScreen'
import WorkspaceScreen from '../screens/WorkspaceScreen'
import MenuScreen from '../screens/MenuScreen'
import PatientHomeScreen from '../screens/patient/PatientHomeScreen'
import PatientCareScreen from '../screens/patient/PatientCareScreen'
import VerifyDocumentScreen from '../screens/VerifyDocumentScreen'
import { COLORS, RADIUS } from '../theme'

type RootStackParamList = {
  Welcome: undefined
  TwoFactor: undefined
  CreateAccount: { token: string }
  Main: undefined
  // VEC document intelligence — opened from any record-specific
  // verification flow (employment/credential/education). The backend
  // is shared with the web app's VerifyRecordModal.
  VerifyDocument: {
    profileId: string
    recordType: 'employment' | 'education' | 'credential' | 'reference' | 'affiliation' | 'identity'
    recordId: string
    recordLabel: string
  }
}

type OrgTabParamList = {
  Dashboard: undefined
  Claims: undefined
  Credentials: undefined
  Workspace: undefined
  More: undefined
}

type PatientTabParamList = {
  Coverage: undefined
  Care: undefined
  More: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const OrgTab = createBottomTabNavigator<OrgTabParamList>()
const PatientTab = createBottomTabNavigator<PatientTabParamList>()

function TabIcon({
  glyph, focused,
}: {
  glyph: string
  focused: boolean
}) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text
        style={[
          styles.tabIconGlyph,
          { color: focused ? COLORS.bg : COLORS.text3 },
        ]}
      >
        {glyph}
      </Text>
    </View>
  )
}

function OrgTabs({
  role, setRole, signOut,
}: {
  role: 'org' | 'patient'
  setRole: (r: 'org' | 'patient') => void
  signOut: () => void
}) {
  return (
    <OrgTab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.text3,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <OrgTab.Screen
        name="Dashboard"
        component={DashboardHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon glyph="⌂" focused={focused} />,
        }}
      />
      <OrgTab.Screen
        name="Claims"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon glyph="◊" focused={focused} />,
        }}
      />
      <OrgTab.Screen
        name="Credentials"
        component={CardsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon glyph="◐" focused={focused} />,
        }}
      />
      <OrgTab.Screen
        name="Workspace"
        component={WorkspaceScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon glyph="▭" focused={focused} />,
        }}
      />
      <OrgTab.Screen
        name="More"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon glyph="≡" focused={focused} />,
        }}
      >
        {() => (
          <MenuScreen
            currentRole={role}
            onSwitchRole={setRole}
            onSignOut={signOut}
          />
        )}
      </OrgTab.Screen>
    </OrgTab.Navigator>
  )
}

function PatientTabs({
  role, setRole, signOut,
}: {
  role: 'org' | 'patient'
  setRole: (r: 'org' | 'patient') => void
  signOut: () => void
}) {
  return (
    <PatientTab.Navigator
      initialRouteName="Coverage"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.text3,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <PatientTab.Screen
        name="Coverage"
        component={PatientHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon glyph="▤" focused={focused} />,
        }}
      />
      <PatientTab.Screen
        name="Care"
        component={PatientCareScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon glyph="✚" focused={focused} />,
        }}
      />
      <PatientTab.Screen
        name="More"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon glyph="≡" focused={focused} />,
        }}
      >
        {() => (
          <MenuScreen
            currentRole={role}
            onSwitchRole={setRole}
            onSignOut={signOut}
          />
        )}
      </PatientTab.Screen>
    </PatientTab.Navigator>
  )
}

export default function AppNavigator() {
  // 'loading'        : checking persisted Supabase session at boot
  // 'welcome'        : signed-out, waiting for email/password
  // 'twofactor'      : password ok, waiting for SMS OTP
  // 'createAccount'  : opened an invite link, completing signup
  // 'main'           : signed in + 2FA verified, app is open
  const [phase, setPhase] = useState<
    'loading' | 'welcome' | 'twofactor' | 'createAccount' | 'main'
  >('loading')
  const [role, setRole] = useState<'org' | 'patient'>('org')
  const [inviteToken, setInviteToken] = useState<string | null>(null)

  // On boot: check whether a Supabase session is already persisted.
  // If yes, jump straight to 2FA gate (mobile enforces it on every fresh launch).
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) {
        setPhase('twofactor')
      } else {
        setPhase('welcome')
      }
    })
    // React to SIGNED_OUT events (e.g. token refresh failure or explicit signOut)
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT') {
        setPhase('welcome')
        setInviteToken(null)
      }
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const handlePasswordOk = () => setPhase('twofactor')
  const handleTwoFactorOk = () => setPhase('main')
  const handleSignOut = async () => {
    try { await supabase.auth.signOut() } catch {}
    setPhase('welcome')
    setInviteToken(null)
  }
  const handleAccountCreated = (userType: 'org' | 'patient') => {
    setRole(userType)
    setInviteToken(null)
    // Even after invite signup, require 2FA
    setPhase('twofactor')
  }

  if (phase === 'loading') {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.indigo} />
      </View>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      {phase === 'welcome' ? (
        <Stack.Screen name="Welcome">
          {() => (
            <WelcomeScreen
              onSignIn={handlePasswordOk}
              onOpenInviteToken={(token) => {
                setInviteToken(token)
                setPhase('createAccount')
              }}
            />
          )}
        </Stack.Screen>
      ) : phase === 'createAccount' && inviteToken ? (
        <Stack.Screen name="CreateAccount">
          {() => (
            <CreateAccountScreen
              token={inviteToken}
              onAccountCreated={handleAccountCreated}
              onCancel={() => {
                setInviteToken(null)
                setPhase('welcome')
              }}
            />
          )}
        </Stack.Screen>
      ) : phase === 'twofactor' ? (
        <Stack.Screen name="TwoFactor">
          {() => (
            <TwoFactorScreen
              mode="signin"
              phoneHint="***42"
              onVerified={handleTwoFactorOk}
              onCancel={handleSignOut}
            />
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Main">
            {() =>
              role === 'patient' ? (
                <PatientTabs role={role} setRole={setRole} signOut={handleSignOut} />
              ) : (
                <OrgTabs role={role} setRole={setRole} signOut={handleSignOut} />
              )
            }
          </Stack.Screen>
          {/* VEC document intelligence — pushed onto the stack from
              any record-specific verification flow. Same backend
              as the web app's VerifyRecordModal. */}
          <Stack.Screen
            name="VerifyDocument"
            component={VerifyDocumentScreen}
            options={{ presentation: 'modal', headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 76,
    paddingTop: 10,
    paddingBottom: 14,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconActive: { backgroundColor: COLORS.text },
  tabIconGlyph: { fontSize: 18, fontWeight: '700' },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
