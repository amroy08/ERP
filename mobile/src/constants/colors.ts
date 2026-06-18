/**
 * Vantage ERP – Mobile Design System Colors
 * Premium color palette with semantic tokens, gradients, and role accents.
 */

export const colors = {
  // ─── Background layers ───────────────────────────
  background: '#F0F4F8',
  backgroundDark: '#0F172A',
  surface: '#FFFFFF',
  surfaceSoft: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',

  // ─── Borders ─────────────────────────────────────
  border: '#E2E8F0',
  borderSoft: 'rgba(226, 232, 240, 0.6)',
  borderFocus: '#3B82F6',

  // ─── Brand / Primary ─────────────────────────────
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryLight: '#93C5FD',
  primarySoft: 'rgba(59, 130, 246, 0.10)',

  // ─── Text hierarchy ──────────────────────────────
  text: '#0F172A',
  textSecondary: '#475569',
  mutedText: '#94A3B8',
  textInverse: '#FFFFFF',

  // ─── Role accent palettes ────────────────────────
  parent: '#3B82F6',
  parentDark: '#1D4ED8',
  parentLight: '#DBEAFE',
  parentSoft: 'rgba(59, 130, 246, 0.08)',

  student: '#10B981',
  studentDark: '#059669',
  studentLight: '#D1FAE5',
  studentSoft: 'rgba(16, 185, 129, 0.08)',

  teacher: '#8B5CF6',
  teacherDark: '#6D28D9',
  teacherLight: '#EDE9FE',
  teacherSoft: 'rgba(139, 92, 246, 0.08)',

  // ─── Semantic status ─────────────────────────────
  success: '#10B981',
  successDark: '#059669',
  successSoft: 'rgba(16, 185, 129, 0.12)',

  warning: '#F59E0B',
  warningDark: '#D97706',
  warningSoft: 'rgba(245, 158, 11, 0.12)',

  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerSoft: 'rgba(239, 68, 68, 0.10)',

  info: '#3B82F6',
  infoDark: '#2563EB',
  infoSoft: 'rgba(59, 130, 246, 0.10)',

  // ─── Neutrals ────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
};

/**
 * Gradient presets for LinearGradient usage.
 * Each tuple: [start, end]
 */
export const gradients = {
  primary:    ['#3B82F6', '#1D4ED8'] as [string, string],
  parent:     ['#3B82F6', '#1D4ED8'] as [string, string],
  student:    ['#10B981', '#059669'] as [string, string],
  teacher:    ['#8B5CF6', '#6D28D9'] as [string, string],
  danger:     ['#EF4444', '#DC2626'] as [string, string],
  warning:    ['#F59E0B', '#D97706'] as [string, string],
  success:    ['#10B981', '#059669'] as [string, string],
  dark:       ['#1E293B', '#0F172A'] as [string, string],
  surface:    ['#FFFFFF', '#F8FAFC'] as [string, string],
  heroParent: ['#3B82F6', '#6366F1'] as [string, string],
  heroStudent:['#10B981', '#06B6D4'] as [string, string],
  heroTeacher:['#8B5CF6', '#EC4899'] as [string, string],
};

export default colors;
