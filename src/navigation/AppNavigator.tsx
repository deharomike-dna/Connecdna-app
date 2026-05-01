// src/navigation/AppNavigator.tsx

import React from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

type RootTabParamList = {
  Dashboard: undefined;
  Identity: undefined;
  Claims: undefined;
  Audit: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const COLORS = {
  background: '#07111f',
  card: '#0f1b2d',
  text: '#ffffff',
  muted: '#94a3b8',
  accent: '#38bdf8',
  border: '#1e293b',
};

function ScreenContainer({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>ConnecDNA</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {children}
    </ScrollView>
  );
}

function DashboardScreen() {
  return (
    <ScreenContainer
      title="DNA Trust Dashboard"
      subtitle="Unified view of identity, permissions, transaction readiness, and audit posture."
    >
      <View style={styles.grid}>
        <MetricCard label="Trust State" value="Active" />
        <MetricCard label="Identity Layer" value="Ready" />
        <MetricCard label="Claims Review" value="Live" />
        <MetricCard label="Audit Trail" value="Enabled" />
      </View>

      <InfoCard
        title="System Overview"
        body="DNA operates as a verification and execution layer that helps confirm whether the right person, entity, permission, workflow, and transaction state are aligned before action is taken."
      />
    </ScreenContainer>
  );
}

function IdentityScreen() {
  return (
    <ScreenContainer
      title="Identity Verification"
      subtitle="Validate users, providers, counterparties, devices, and execution authority."
    >
      <InfoCard
        title="QIR — Quick Identity Response"
        body="QIR is the moment-of-action identity response used to confirm whether a user or entity is authorized for a specific workflow."
      />

      <InfoCard
        title="PAL — Permission Access Ledger"
        body="PAL records permission states, role boundaries, access rules, and transaction-level authorization conditions."
      />
    </ScreenContainer>
  );
}

function ClaimsScreen() {
  return (
    <ScreenContainer
      title="Claims Readiness"
      subtitle="Review healthcare claim readiness before submission."
    >
      <InfoCard
        title="Transaction Readiness"
        body="DNA can help check whether claim data, provider identity, location, payer rules, permissions, and supporting documentation are aligned before submission."
      />

      <InfoCard
        title="Pre-Submission Review"
        body="This layer is designed to support review and verification workflows. It does not replace clinical judgment, payer rules, or official billing system requirements."
      />
    </ScreenContainer>
  );
}

function AuditScreen() {
  return (
    <ScreenContainer
      title="Audit Evidence"
      subtitle="Track execution history, permission decisions, and verification events."
    >
      <InfoCard
        title="Audit-Grade Records"
        body="Each material action can be associated with an evidence trail showing who acted, what was verified, what permissions applied, and what state changed."
      />

      <InfoCard
        title="Compliance Support"
        body="DNA can support internal review, payer audits, access-control reviews, and operational compliance documentation."
      />
    </ScreenContainer>
  );
}

function SettingsScreen() {
  return (
    <ScreenContainer
      title="Settings"
      subtitle="System configuration and environment status."
    >
      <InfoCard
        title="Environment"
        body="Preview environment is active. Connect your API client, Supabase credentials, and production rules when ready."
      />

      <InfoCard
        title="Next Step"
        body="Replace placeholder screens with your production screens after the Android build succeeds."
      />
    </ScreenContainer>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoBody}>{body}</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Identity" component={IdentityScreen} />
      <Tab.Screen name="Claims" component={ClaimsScreen} />
      <Tab.Screen name="Audit" component={AuditScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  kicker: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  infoBody: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
