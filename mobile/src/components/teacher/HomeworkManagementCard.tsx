import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '../AppCard';
import { AppButton } from '../AppButton';
import { StatusBadge } from '../StatusBadge';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

interface HomeworkManagementCardProps {
  title: string;
  subjectName: string;
  className: string;
  sectionName?: string;
  dueDate?: string;
  totalStudents?: number;
  submittedCount?: number;
  pendingCount?: number;
  reviewedCount?: number;
  description?: string;
  onReview: () => void;
}

const getDueDateStyle = (dueDate?: string): { color: string; label: string } => {
  if (!dueDate) return { color: colors.mutedText, label: '' };
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { color: colors.danger, label: 'Overdue' };
  if (diff === 0) return { color: colors.warning, label: 'Due Today' };
  if (diff <= 2) return { color: colors.warning, label: `Due in ${diff}d` };
  return {
    color: colors.mutedText,
    label: `Due ${due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
  };
};

export const HomeworkManagementCard: React.FC<HomeworkManagementCardProps> = ({
  title,
  subjectName,
  className,
  sectionName,
  dueDate,
  totalStudents = 0,
  submittedCount = 0,
  pendingCount = 0,
  reviewedCount = 0,
  description,
  onReview,
}) => {
  const dueInfo = getDueDateStyle(dueDate);
  const hasPending = pendingCount > 0;

  return (
    <AppCard style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <StatusBadge
          label={`${className}${sectionName ? ' ' + sectionName : ''}`}
          type="info"
        />
      </View>

      <Text style={styles.subjectName}>{subjectName}</Text>

      {description ? (
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      ) : null}

      {/* Pending alert */}
      {hasPending && (
        <View style={styles.pendingBanner}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
          <Text style={styles.pendingBannerText}>{pendingCount} submission{pendingCount > 1 ? 's' : ''} pending review</Text>
        </View>
      )}

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={[styles.statCell, styles.statDivider]}>
          <Text style={[styles.statValue, { color: colors.info }]}>{submittedCount}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
        <View style={[styles.statCell, styles.statDivider]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCell, styles.statDivider]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{reviewedCount}</Text>
          <Text style={styles.statLabel}>Reviewed</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        {dueInfo.label ? (
          <View style={[styles.dueBadge, { borderColor: dueInfo.color + '50' }]}>
            <Ionicons name="time-outline" size={12} color={dueInfo.color} />
            <Text style={[styles.dueText, { color: dueInfo.color }]}>{dueInfo.label}</Text>
          </View>
        ) : <View />}
        <AppButton
          title="Review Submissions"
          onPress={onReview}
          variant="teacher"
          style={styles.reviewBtn}
          textStyle={{ fontSize: 12 }}
          icon={<Ionicons name="eye-outline" size={14} color={colors.white} />}
        />
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.headingSmall,
    color: colors.text,
    fontWeight: '800',
    flex: 1,
  },
  subjectName: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '12',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warning + '30',
    marginBottom: spacing.sm,
  },
  pendingBannerText: {
    ...typography.captionSmall,
    color: colors.warning,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statValue: {
    ...typography.statSmall,
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  statLabel: {
    ...typography.captionSmall,
    color: colors.mutedText,
    marginTop: 2,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dueText: {
    ...typography.captionSmall,
    fontWeight: '700',
  },
  reviewBtn: {
    height: 36,
    marginVertical: 0,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
});

export default HomeworkManagementCard;
