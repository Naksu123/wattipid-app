// Wattipid Design System — Premium Dark Theme
export const COLORS = {
  // Primary brand
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  primaryGlow: 'rgba(34, 197, 94, 0.25)',

  // Accent
  accent: '#F97316',
  accentLight: '#FB923C',

  // Backgrounds
  background: '#0F172A',
  backgroundLight: '#1E293B',
  surface: '#1E293B',
  surfaceLight: '#334155',
  surfaceGlass: 'rgba(30, 41, 59, 0.7)',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  info: '#3B82F6',

  // Borders
  border: 'rgba(148, 163, 184, 0.15)',
  borderLight: 'rgba(148, 163, 184, 0.25)',

  // White / Black
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const GRADIENTS = {
  primary: ['#22C55E', '#16A34A'],
  accent: ['#F97316', '#EA580C'],
  card: ['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.9)'],
  cardGlass: ['rgba(30, 41, 59, 0.6)', 'rgba(15, 23, 42, 0.4)'],
  danger: ['#EF4444', '#DC2626'],
  dark: ['#1E293B', '#0F172A'],
  hero: ['#0F172A', '#1E293B', '#0F172A'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  hero: 34,
  display: 42,
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color = COLORS.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  }),
};
