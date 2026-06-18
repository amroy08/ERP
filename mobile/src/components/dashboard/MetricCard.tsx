import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '../AppCard';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface MetricCardProps {
  label: string;
  value: string | number;
  color: string;
  iconName: IconName;
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  color,
  iconName,
  onPress,
}) => {
  const CardContent = (
    <View style={styles.cardContent}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={iconName} size={20} color={color} />
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  return (
    <AppCard
      style={[styles.card, { borderColor: color + '25', borderWidth: 1 }]}
      onPress={onPress}
    >
      {CardContent}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadows.sm,
    backgroundColor: colors.surface,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.statMedium,
    fontWeight: '800',
  },
  label: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: spacing.xxs,
    fontWeight: '600',
  },
});

export default MetricCard;
