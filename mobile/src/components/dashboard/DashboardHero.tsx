import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBadge } from '../StatusBadge';
import { NotificationBell } from '../notifications/NotificationBell';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

interface DashboardHeroProps {
  greeting: string;
  name: string;
  subText?: string;
  roleLabel: string;
  roleType: 'student' | 'parent' | 'teacher';
  gradientColors: [string, string];
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  greeting,
  name,
  subText,
  roleLabel,
  roleType,
  gradientColors,
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.contentRow}>
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {subText ? <Text style={styles.subText} numberOfLines={1}>{subText}</Text> : null}
        </View>
        <View style={styles.rightContainer}>
          <NotificationBell roleType={roleType} />
          <StatusBadge label={roleLabel} type={roleType} />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    ...shadows.md,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  greeting: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  name: {
    ...typography.displaySmall,
    color: colors.white,
    marginTop: spacing.xxs,
  },
  subText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginTop: spacing.xxs,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
    gap: spacing.xs,
  },
});

export default DashboardHero;
