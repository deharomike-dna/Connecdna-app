// src/navigation/AppNavigator.tsx
// Role-aware navigation.
// Provider/Admin → ProviderTabs (Home, Claims, Signals, Credentials, Admin)
// Patient → PatientTabs (Check-in, Insurance, Visits, Profile)
// Unauthenticated → AuthStack (Login, Signup)

import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View, ActivityIndicator } from 'react-native'
import { auth } from '../api/dna-client'
import { COLORS } from '../theme'

// ─── Screens (imported lazily) ─────────────────────────────────────────────
import LoginScreen from '../screens/auth/LoginScreen'
import SignupScreen from '../screens/auth/SignupScreen'

import ProviderHomeScreen from '../screens/provider/HomeScreen'
import ClaimsScreen from '../screens/provider/ClaimsScreen'
import SignalsScreen from '../screens/provider/SignalsScreen'
import CredentialingScreen from '../screens/provider/CredentialingScreen'
import AdminScreen from '../screens/admin/AdminScreen'

import PatientCheckinScreen from '../screens/patient/CheckinScreen'
import PatientInsuranceScreen from '../screens/patient/InsuranceScreen'
import PatientVisitsScreen from '../screens/patient/VisitsScreen'
import PatientProfileScreen from '../screens/patient/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// ─── Provider / Admin tabs ─────────────────────────────────────────────────

function ProviderTabs({ role }: { role: string }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.bg2, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.blue,
        tabBarInactiveTintColor: COLORS.text3,
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'System' },
      }}
    >
      <Tab.Screen name="Home" component={ProviderHomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }} />
      <Tab.Screen name="Claims" component={ClaimsScreen}
        options={{ tabBarLabel: 'Claims', tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} /> }} />
      <Tab.Screen name="Signals" component={SignalsScreen}
        options={{ tabBarLabel: 'Signals', tabBarIcon: ({ color }) => <TabIcon icon="⚡" color={color} /> }} />
      <Tab.Screen name="Credentials" component={CredentialingScreen}
        options={{ tabBarLabel: 'Credentials', tabBarIcon: ({ color }) => <TabIcon icon="🏅" color={color} /> }} />
      {role === 'admin' && (
        <Tab.Screen name="Admin" component={AdminScreen}
          options={{ tabBarLabel: 'Admin', tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} /> }} />
      )}
    </Tab.Navigator>
  )
}

// ─── Patient tabs ──────────────────────────────────────────────────────────

function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.bg2, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.text3,
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tab.Screen name="Checkin" component={PatientCheckinScreen}
        options={{ tabBarLabel: 'Check-in', tabBarIcon: ({ color }) => <TabIcon icon="🏥" color={color} /> }} />
      <Tab.Screen name="Insurance" component={PatientInsuranceScreen}
        options={{ tabBarLabel: 'Insurance', tabBarIcon: ({ color }) => <TabIcon icon="💳" color={color} /> }} />
      <Tab.Screen name="Visits" component={PatientVisitsScreen}
        options={{ tabBarLabel: 'Visits', tabBarIcon: ({ color }) => <TabIcon icon="📅" color={color} /> }} />
      <Tab.Screen name="Profile" component={PatientProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }} />
    </Tab.Navigator>
  )
}

// ─── Root navigator ────────────────────────────────────────────────────────

export default function AppNavigator() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<{ role: string | null; authenticated: boolean }>({
    role: null, authenticated: false,
  })

  useEffect(() => {
    auth.getSession().then(s => {
      setSession({ role: s.role, authenticated: !!s.apiKey })
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.green} />
      </View>
    )
  }

  return (
    <NavigationContainer theme={{
      dark: true,
      colors: {
        primary: COLORS.blue, background: COLORS.bg,
        card: COLORS.bg2, text: COLORS.text,
        border: COLORS.border, notification: COLORS.red,
      },
    }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session.authenticated ? (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : session.role === 'patient' ? (
          // Patient app
          <Stack.Screen name="PatientApp">
            {() => <PatientTabs />}
          </Stack.Screen>
        ) : (
          // Provider / Admin app
          <Stack.Screen name="ProviderApp">
            {() => <ProviderTabs role={session.role ?? 'staff'} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 20, opacity: color === COLORS.text3 ? 0.5 : 1 }}>{icon}</Text>
}
