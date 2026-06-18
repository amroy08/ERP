/**
 * Vantage ERP – EmptyState (Premium Design System)
 * Beautiful empty state card with Ionicons icon instead of emoji.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, radii } from '../constants/layout';
import { typography } from '../constants/typography';
import { shadows } from '../constants/shadows';
import { AppIcon, IconName } from './AppIcon';

interface EmptyStateProps {
  /** Ionicons icon name (replaces old emoji prop) */
  icon?: IconName;
  /** Fallback: raw emoji string – for backward compat */
  emoji?: string;
  title: string;
  subtitle: string;
  /** Accent color for the icon */
  accentColor?: string;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  emoji,
  title,
  subtitle,
  accentColor = colors.primary,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.container}>
        {icon ? (
          <AppIcon
            name={icon}
            size={32}
            color={accentColor}
            contained
            containerColor={accentColor + '15'}
            containerSize={64}
            containerStyle={{ borderRadius: radii.xl, marginBottom: spacing.lg }}
          />
        ) : emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.sm,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  emoji: {
    fontSize: 36,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headingSmall,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
});

export default EmptyState;
