// Wattipid Premium Design System

export const COLORS = {
  // Primary brand (Sleek Emerald / Neon Green)
  primary: '#10B981',      // Base emerald
  primaryDark: '#059669',  // Deep emerald
  primaryLight: '#34D399', // Bright neon green
  primaryGlow: 'rgba(16, 185, 129, 0.25)',

  // Accent (Electric Orange/Amber)
  accent: '#F59E0B',
  accentLight: '#FBBF24',

  // Backgrounds (Deep, premium dark blue/blacks like modern fintech)
  background: '#0B0F19',       // Deepest background
  backgroundLight: '#111827',  // Elevated background
  surface: '#1F2937',          // Base card
  surfaceLight: '#374151',     // Elevated card
  surfaceGlass: 'rgba(31, 41, 55, 0.65)', // Premium translucent

  // Text
  textPrimary: '#F9FAFB',      // Near white
  textSecondary: '#9CA3AF',    // Cool gray
  textMuted: '#6B7280',        // Deep gray

  // Status Colors (Soft, modern tones)
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  borderHighlight: 'rgba(255, 255, 255, 0.25)',

  // Base
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const GRADIENTS = {
  primary: ['#10B981', '#059669'],
  accent: ['#F59E0B', '#D97706'],
  card: ['rgba(31, 41, 55, 0.95)', 'rgba(17, 24, 39, 0.95)'],
  cardGlass: ['rgba(31, 41, 55, 0.7)', 'rgba(17, 24, 39, 0.4)'],
  cardGlassPremium: ['rgba(55, 65, 81, 0.4)', 'rgba(31, 41, 55, 0.2)'],
  danger: ['#EF4444', '#B91C1C'],
  dark: ['#111827', '#0B0F19'],
  hero: ['#0B0F19', '#111827', '#0B0F19'],
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
  xl: 24,    // More rounded cards for modern feel
  xxl: 32,
  full: 999,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
  display: 48,
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
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  glow: (color = COLORS.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  }),
};
