/**
 * Vantage ERP – StatusBadge (Premium Design System)
 * Small pill badges for status indicators and role labels.
 */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { radii, spacing } from '../constants/layout';
import { typography } from '../constants/typography';

type BadgeType = 'success' | 'warning' | 'danger' | 'info' | 'parent' | 'student' | 'teacher';

interface StatusBadgeProps {
  label: string;
  type?: BadgeType;
  style?: ViewStyle;
  /** Small variant: less padding, smaller text */
  small?: boolean;
}

const badgeColors: Record<BadgeType, { bg: string; text: string }> = {
  success:  { bg: colors.successSoft, text: colors.success },
  warning:  { bg: colors.warningSoft, text: colors.warningDark },
  danger:   { bg: colors.dangerSoft,  text: colors.danger },
  info:     { bg: colors.infoSoft,    text: colors.infoDark },
  parent:   { bg: colors.parentSoft + '80', text: colors.parent },
  student:  { bg: colors.studentSoft + '80', text: colors.student },
  teacher:  { bg: colors.teacherSoft + '80', text: colors.teacher },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  type = 'info',
  style,
  small = false,
}) => {
  const palette = badgeColors[type];

  return (
    <View
      style={[
        styles.badge,
        small && styles.badgeSmall,
        { backgroundColor: palette.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          small && styles.textSmall,
          { color: palette.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
  },
  text: {
    ...typography.captionSmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 10,
    lineHeight: 12,
  },
});

export default StatusBadge;
