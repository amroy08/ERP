/**
 * Vantage ERP – AppCard (Premium Design System)
 * Elevated card with consistent shadows, radii, and subtle border styling.
 */
import React from 'react';
import { StyleSheet, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, radii } from '../constants/layout';
import { shadows } from '../constants/shadows';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Remove shadow and border for an embedded look */
  flat?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ children, style, onPress, flat = false }) => {
  const cardStyle = [
    styles.card,
    !flat && shadows.sm,
    flat && styles.flat,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.cardPadding,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  flat: {
    borderWidth: 0,
    backgroundColor: colors.surfaceSoft,
  },
});

export default AppCard;
