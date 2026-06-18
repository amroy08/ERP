/**
 * Vantage ERP – AppButton (Premium Design System)
 * Primary, secondary, role-themed, and danger button variants with
 * consistent typography, shadows, and gradient support.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../constants/colors';
import { spacing, radii, sizing } from '../constants/layout';
import { typography } from '../constants/typography';
import { shadows } from '../constants/shadows';

type ButtonVariant = 'primary' | 'secondary' | 'parent' | 'student' | 'teacher' | 'danger' | 'ghost';
type ButtonSize = 'large' | 'medium' | 'small';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  /** Use gradient background instead of flat color */
  gradient?: boolean;
  /** Optional left icon element */
  icon?: React.ReactNode;
}

const getGradientColors = (variant: ButtonVariant): [string, string] => {
  switch (variant) {
    case 'parent':  return gradients.parent;
    case 'student': return gradients.student;
    case 'teacher': return gradients.teacher;
    case 'danger':  return gradients.danger;
    default:        return gradients.primary;
  }
};

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  style,
  textStyle,
  gradient = false,
  icon,
}) => {
  const isGhost = variant === 'ghost';
  const isSecondary = variant === 'secondary';

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceSoft;
    if (isGhost || isSecondary) return colors.transparent;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'parent':  return colors.parent;
      case 'student': return colors.student;
      case 'teacher': return colors.teacher;
      case 'danger':  return colors.danger;
      default:        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.mutedText;
    if (isGhost) return colors.primary;
    if (isSecondary) return colors.text;
    return colors.textInverse;
  };

  const heightMap: Record<ButtonSize, number> = {
    large: sizing.inputHeight,
    medium: 44,
    small: sizing.buttonSmall,
  };

  const textPreset = size === 'small' ? typography.buttonSmall : size === 'medium' ? typography.buttonMedium : typography.buttonLarge;
  const btnHeight = heightMap[size];
  const btnRadius = size === 'small' ? radii.sm : radii.md;

  const inner = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && <View style={styles.iconSlot}>{icon}</View>}
          <Text style={[textPreset, { color: getTextColor() }, textStyle]}>{title}</Text>
        </>
      )}
    </View>
  );

  if (gradient && !disabled && !isGhost && !isSecondary) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled || loading}
        style={[{ marginVertical: spacing.sm }, shadows.md, style]}
      >
        <LinearGradient
          colors={getGradientColors(variant)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            { height: btnHeight, borderRadius: btnRadius },
          ]}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          height: btnHeight,
          borderRadius: btnRadius,
          backgroundColor: getBackgroundColor(),
        },
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        !disabled && !isGhost && !isSecondary && shadows.sm,
        style,
      ]}
    >
      {inner}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    marginRight: spacing.sm,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
});

export default AppButton;
