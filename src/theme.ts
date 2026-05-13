// src/theme.ts
// Shared design system: tokens + reusable StyleSheet exports.
// Inspired by clean fintech mobile UI — deep navy surfaces, rounded cards,
// generous whitespace, soft borders, and confident type scale.

import { StyleSheet, TextStyle } from 'react-native'

export const COLORS = {
  // Surfaces
  bg: '#0a0c10',
  surface: '#0f1521',
  surface2: '#162033',
  surfaceElevated: '#1c2942',

  // Borders
  border: '#1e293b',
  border2: '#2a3a52',

  // Text
  text: '#ffffff',
  text2: '#cbd5e1',
  text3: '#64748b',

  // Accents
  green: '#22c55e',
  greenSoft: 'rgba(34,197,94,0.12)',
  amber: '#f59e0b',
  amberSoft: 'rgba(245,158,11,0.12)',
  red: '#ef4444',
  redSoft: 'rgba(239,68,68,0.12)',
  blue: '#38bdf8',
  blueSoft: 'rgba(56,189,248,0.12)',
  indigo: '#6366f1',

  // Card gradients (used as solid fallbacks where LinearGradient isn't installed)
  cardUSD: '#1e3a8a',
  cardEUR: '#0f766e',
  cardGBP: '#7c3aed',

  // Misc
  white: '#ffffff',
  shadow: 'rgba(0,0,0,0.4)',
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
}

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
}

export const TYPO = {
  display: { fontSize: 32, fontWeight: '800', color: COLORS.text } as TextStyle,
  h1: { fontSize: 24, fontWeight: '800', color: COLORS.text } as TextStyle,
  h2: { fontSize: 20, fontWeight: '700', color: COLORS.text } as TextStyle,
  h3: { fontSize: 16, fontWeight: '700', color: COLORS.text } as TextStyle,
  body: { fontSize: 14, fontWeight: '400', color: COLORS.text2 } as TextStyle,
  caption: { fontSize: 12, fontWeight: '500', color: COLORS.text3 } as TextStyle,
  mono: { fontFamily: 'Courier', fontSize: 16, color: COLORS.text } as TextStyle,
}

// Reusable styles used across screens. Names match what the existing
// provider/auth screens already import, so they keep working.
export const S = StyleSheet.create({
  // Layout
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Header
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  pageSub: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text3,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text2,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardElevated: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border2,
  },
  cardRed: { borderLeftWidth: 3, borderLeftColor: COLORS.red, backgroundColor: COLORS.redSoft },
  cardAmber: { borderLeftWidth: 3, borderLeftColor: COLORS.amber, backgroundColor: COLORS.amberSoft },
  cardGreen: { borderLeftWidth: 3, borderLeftColor: COLORS.green, backgroundColor: COLORS.greenSoft },
  cardBlue: { borderLeftWidth: 3, borderLeftColor: COLORS.blue, backgroundColor: COLORS.blueSoft },

  // Stats grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Form
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text2,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border2,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },

  // Buttons
  btnPrimary: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.bg,
    letterSpacing: 0.2,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border2,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Badges
  badgeAmber: {
    backgroundColor: COLORS.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeGreen: {
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeRed: {
    backgroundColor: COLORS.redSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // List rows (used by Menu screen)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
})
