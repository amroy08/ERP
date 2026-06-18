/**
 * Vantage ERP – SectionHeader (Premium Design System)
 * Consistent section header used across all screens.
 * Replaces inline sectionTitle styles scattered throughout the app.
 */
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/layout';
import { typography } from '../constants/typography';
import { AppIcon, IconName } from './AppIcon';

interface SectionHeaderProps {
  title: string;
  /** Optional icon to the left of the title */
  icon?: IconName;
  iconColor?: string;
  /** "See All" / action link on the right */
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  iconColor = colors.mutedText,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {icon && (
          <AppIcon
            name={icon}
            size={16}
            color={iconColor}
            containerStyle={{ marginRight: spacing.xs }}
          />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.overline,
  },
  action: {
    ...typography.labelSmall,
    color: colors.primary,
  },
});

export default SectionHeader;
