import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

interface NoticePreviewCardProps {
  title: string;
  priority: string;
  publishDate: string;
  onPress?: () => void;
}

export const NoticePreviewCard: React.FC<NoticePreviewCardProps> = ({
  title,
  priority,
  publishDate,
  onPress,
}) => {
  const isUrgent = priority.toLowerCase() === 'urgent' || priority.toLowerCase() === 'high';
  
  return (
    <AppCard style={styles.card} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <StatusBadge
          label={priority.toUpperCase()}
          type={isUrgent ? 'danger' : 'info'}
        />
      </View>
      <Text style={styles.date}>
        {new Date(publishDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  date: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
});

export default NoticePreviewCard;
