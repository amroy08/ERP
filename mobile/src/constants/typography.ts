/**
 * Vantage ERP – Mobile Design System Typography
 * Consistent type scale for the entire app. Use these presets instead of inline fontSize/fontWeight.
 */
import { TextStyle, Platform } from 'react-native';
import { colors } from './colors';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

/**
 * Type scale tokens – each returns a complete TextStyle.
 */
export const typography = {
  // ─── Display ──────────────────────────────────
  displayLarge: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
  } as TextStyle,

  displayMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
  } as TextStyle,

  displaySmall: {
    fontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
  } as TextStyle,

  // ─── Headings ─────────────────────────────────
  headingLarge: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
  } as TextStyle,

  headingMedium: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  } as TextStyle,

  headingSmall: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,

  // ─── Body ─────────────────────────────────────
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: colors.text,
  } as TextStyle,

  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.text,
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,

  // ─── Labels / Captions ────────────────────────
  label: {
    fontFamily,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,

  labelSmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  } as TextStyle,

  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.mutedText,
  } as TextStyle,

  captionSmall: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: colors.mutedText,
  } as TextStyle,

  // ─── Overline / Tab bar ───────────────────────
  overline: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.mutedText,
  } as TextStyle,

  tabLabel: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.mutedText,
  } as TextStyle,

  // ─── Stat / number emphasis ───────────────────
  statLarge: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.text,
  } as TextStyle,

  statMedium: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: colors.text,
  } as TextStyle,

  statSmall: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  } as TextStyle,

  // ─── Button ───────────────────────────────────
  buttonLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,

  buttonMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  } as TextStyle,

  buttonSmall: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  } as TextStyle,
} as const;

export default typography;
