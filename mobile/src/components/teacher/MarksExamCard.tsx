import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';

interface MarksExamCardProps {
  examName: string;
  className: string;
  examDate?: string;
  totalSubjects?: number;
  totalStudents?: number;
  marksEnteredCount?: number;
  status?: string;
  onPress: () => void;
}

export const MarksExamCard: React.FC<MarksExamCardProps> = ({
  examName,
  className,
  examDate,
  totalSubjects = 0,
  totalStudents = 0,
  marksEnteredCount = 0,
  status = 'scheduled',
  onPress,
}) => {
  const progress = totalStudents > 0 ? Math.min(marksEnteredCount / totalStudents, 1) : 0;
  const progressPct = Math.round(progress * 100);
  const statusType = status === 'completed' ? 'success' : 'info';

  return (
    <AppCard style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.examName} numberOfLines={2}>{examName}</Text>
        <StatusBadge label={status?.toUpperCase() ?? 'SCHEDULED'} type={statusType} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.classBadge}>
          <Text style={styles.classBadgeText}>{className}</Text>
        </View>
        {examDate ? (
          <Text style={styles.examDate}>
            <Ionicons name="calendar-outline" size={11} color={colors.mutedText} /> {examDate}
          </Text>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.statsStrip}>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{totalSubjects}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={[styles.statCell, styles.divider]}>
          <Text style={styles.statVal}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={[styles.statCell, styles.divider]}>
          <Text style={[styles.statVal, { color: colors.teacher }]}>{marksEnteredCount}</Text>
          <Text style={styles.statLabel}>Graded</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{progressPct}% marked</Text>
        <View style={styles.manageRow}>
          <Text style={styles.manageText}>Manage Marks</Text>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  examName: {
    ...typography.headingSmall,
    color: colors.text,
    fontWeight: '800',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  classBadge: {
    backgroundColor: colors.teacher + '12',
    borderRadius: radii.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  classBadgeText: {
    ...typography.captionSmall,
    color: colors.teacher,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  examDate: {
    ...typography.captionSmall,
    color: colors.mutedText,
    fontWeight: '500',
  },
  statsStrip: {
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
    ...typography.headingSmall,
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...typography.captionSmall,
    color: colors.mutedText,
    fontWeight: '500',
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  manageText: {
    ...typography.captionSmall,
    color: colors.teacher,
    fontWeight: '700',
  },
});

export default MarksExamCard;
