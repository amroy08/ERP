import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '../AppCard';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';

interface MarksSubjectCardProps {
  subjectName: string;
  sectionName?: string;
  className?: string;
  maxMarks?: number;
  totalStudents?: number;
  marksEnteredCount?: number;
  onPress: () => void;
}

export const MarksSubjectCard: React.FC<MarksSubjectCardProps> = ({
  subjectName,
  sectionName,
  className,
  maxMarks = 100,
  totalStudents = 0,
  marksEnteredCount = 0,
  onPress,
}) => {
  const progress = totalStudents > 0 ? Math.min(marksEnteredCount / totalStudents, 1) : 0;
  const progressPct = Math.round(progress * 100);

  return (
    <AppCard style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Ionicons name="document-text-outline" size={18} color={colors.teacher} />
        </View>
        <View style={styles.info}>
          <Text style={styles.subjectName}>{subjectName}</Text>
          {(className || sectionName) ? (
            <Text style={styles.meta}>
              {[className, sectionName].filter(Boolean).join(' – ')}
            </Text>
          ) : null}
        </View>
        <View style={styles.maxMarksBadge}>
          <Text style={styles.maxMarksText}>Max: {maxMarks}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={[styles.statCell, styles.divider]}>
          <Text style={[styles.statVal, { color: colors.teacher }]}>{marksEnteredCount}</Text>
          <Text style={styles.statLabel}>Graded</Text>
        </View>
        <View style={[styles.statCell, styles.divider]}>
          <Text style={[styles.statVal, { color: colors.mutedText }]}>{totalStudents - marksEnteredCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.progressLabel}>{progressPct}% graded</Text>
        <View style={styles.enterRow}>
          <Text style={styles.enterText}>Enter Marks</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.teacher} />
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.teacher + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  subjectName: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
  },
  meta: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xxs,
  },
  maxMarksBadge: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  maxMarksText: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statVal: {
    ...typography.label,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    ...typography.captionSmall,
    color: colors.mutedText,
    marginTop: spacing.xxs,
    fontWeight: '600',
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.teacher,
    borderRadius: radii.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...typography.captionSmall,
    color: colors.mutedText,
  },
  enterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  enterText: {
    ...typography.captionSmall,
    color: colors.teacher,
    fontWeight: '700',
  },
});

export default MarksSubjectCard;
