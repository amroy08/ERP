import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';

interface TeacherScreenHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  onBack?: () => void;
  backLabel?: string;
}

export const TeacherScreenHeader: React.FC<TeacherScreenHeaderProps> = ({
  title,
  subtitle,
  badge,
  onBack,
  backLabel = 'Back',
}) => {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={colors.teacher} />
          <Text style={styles.backLabel}>{backLabel}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge !== undefined && (
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  backLabel: {
    ...typography.labelSmall,
    color: colors.teacher,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xxs,
  },
  badgeBox: {
    backgroundColor: colors.teacher + '15',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.teacher + '30',
  },
  badgeText: {
    ...typography.labelSmall,
    color: colors.teacher,
    fontWeight: '800',
  },
});

export default TeacherScreenHeader;
