/**
 * Vantage ERP – Mobile Design System Spacing & Layout
 * Consistent spacing scale, radii, and sizing tokens.
 */

/** Base spacing unit: 4px. Multiply for consistency. */
export const spacing = {
  /** 2px – hairline gaps */
  xxs: 2,
  /** 4px – micro gaps */
  xs: 4,
  /** 8px – tight spacing */
  sm: 8,
  /** 12px – compact spacing */
  md: 12,
  /** 16px – default padding */
  lg: 16,
  /** 20px – comfortable spacing */
  xl: 20,
  /** 24px – section gaps */
  xxl: 24,
  /** 32px – large gaps */
  xxxl: 32,
  /** 40px – hero / major gaps */
  huge: 40,
  /** 48px – screen-level margins */
  massive: 48,

  /** Screen horizontal padding */
  screenPadding: 20,

  /** Card internal padding */
  cardPadding: 16,
  cardPaddingLarge: 20,
} as const;

/** Border-radius scale */
export const radii = {
  /** 4px – subtle rounding (badges, tiny chips) */
  xs: 4,
  /** 8px – form inputs, chips */
  sm: 8,
  /** 12px – cards, buttons */
  md: 12,
  /** 16px – large cards */
  lg: 16,
  /** 20px – hero cards */
  xl: 20,
  /** 24px – modals, sheets */
  xxl: 24,
  /** Full circle */
  full: 999,
} as const;

/** Component sizing presets */
export const sizing = {
  /** Bottom tab bar height */
  tabBarHeight: 72,
  /** Standard input / button height */
  inputHeight: 52,
  /** Compact button height */
  buttonSmall: 40,
  /** Avatar sizes */
  avatarSmall: 32,
  avatarMedium: 44,
  avatarLarge: 56,
  /** Icon container */
  iconBox: 40,
  iconBoxSmall: 32,
  iconBoxLarge: 48,
} as const;

export default { spacing, radii, sizing };
