/**
 * Vantage ERP – Mobile Design System Shadows
 * Elevation presets for iOS + Android.
 */
import { Platform, ViewStyle } from 'react-native';

const createShadow = (
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ViewStyle => ({
  ...(Platform.OS === 'ios'
    ? {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: offsetY },
        shadowOpacity: opacity,
        shadowRadius: radius,
      }
    : {
        elevation,
      }),
});

export const shadows = {
  /** No shadow */
  none: createShadow(0, 0, 0, 0),

  /** Subtle lift – cards at rest */
  sm: createShadow(1, 3, 0.06, 1),

  /** Default – interactive cards */
  md: createShadow(2, 6, 0.08, 3),

  /** Raised – floating buttons, dropdowns */
  lg: createShadow(4, 12, 0.1, 6),

  /** Overlay – modals, bottom sheets */
  xl: createShadow(8, 24, 0.14, 10),

  /** Colored shadow helper for gradient cards */
  colored: (color: string, opacity = 0.2): ViewStyle =>
    Platform.OS === 'ios'
      ? {
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: opacity,
          shadowRadius: 12,
        }
      : {
          elevation: 6,
        },
} as const;

export default shadows;
