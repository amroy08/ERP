import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../AppCard';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

interface TodayScheduleCardProps {
  period: string;
  subjectName: string;
  timeRange: string;
  subText?: string;
  roleColor: string;
}

export const TodayScheduleCard: React.FC<TodayScheduleCardProps> = ({
  period,
  subjectName,
  timeRange,
  subText,
  roleColor,
}) => {
  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.periodBox, { backgroundColor: roleColor + '15' }]}>
          <Text style={[styles.periodText, { color: roleColor }]}>{period}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.subjectName}>{subjectName}</Text>
          {subText ? <Text style={styles.subText}>{subText}</Text> : null}
        </View>
        <Text style={styles.timeRange}>{timeRange}</Text>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  periodBox: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodText: {
    ...typography.label,
    fontWeight: '800',
  },
  detailsContainer: {
    flex: 1,
  },
  subjectName: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  subText: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
    fontWeight: '500',
  },
  timeRange: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'right',
    fontWeight: '600',
  },
});

export default TodayScheduleCard;
