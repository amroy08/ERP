/**
 * Vantage ERP – ErrorState (Premium Design System)
 * Styled error card with role-themed retry button, using Ionicons.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, radii } from '../constants/layout';
import { typography } from '../constants/typography';
import { shadows } from '../constants/shadows';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
import { AppIcon } from './AppIcon';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  roleTheme?: 'parent' | 'student' | 'teacher';
  style?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  roleTheme = 'parent',
  style,
}) => {
  const themeColor =
    roleTheme === 'student' ? colors.student
    : roleTheme === 'teacher' ? colors.teacher
    : colors.parent;

  return (
    <AppCard style={[styles.card, { borderColor: themeColor + '40' }, style]}>
      <View style={styles.container}>
        <AppIcon
          name="alert-circle-outline"
          size={28}
          color={colors.danger}
          contained
          containerColor={colors.dangerSoft}
          containerSize={56}
          containerStyle={{ borderRadius: radii.xl, marginBottom: spacing.md }}
        />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{error}</Text>
        {onRetry && (
          <AppButton
            title="Try Again"
            onPress={onRetry}
            variant={roleTheme}
            size="small"
            style={styles.retryBtn}
          />
        )}
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.md,
    padding: spacing.xxl,
    borderWidth: 1,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.headingSmall,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.bodySmall,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: spacing.xs,
    marginVertical: 0,
  },
});

export default ErrorState;
