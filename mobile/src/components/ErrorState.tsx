import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  roleTheme?: 'parent' | 'student' | 'teacher';
  style?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, roleTheme = 'parent', style }) => {
  const getThemeColor = () => {
    if (roleTheme === 'student') return colors.student;
    if (roleTheme === 'teacher') return colors.teacher;
    return colors.parent;
  };

  const themeColor = getThemeColor();

  return (
    <AppCard style={[styles.card, { borderColor: themeColor + '55', borderWidth: 1 }, style]}>
      <View style={styles.container}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{error}</Text>
        {onRetry && (
          <AppButton
            title="Retry"
            onPress={onRetry}
            variant={roleTheme}
            style={styles.retryBtn}
            textStyle={styles.retryBtnText}
          />
        )}
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    padding: 24,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  retryBtn: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 20,
    marginTop: 4,
    marginVertical: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  retryBtnText: {
    fontSize: 14,
  },
});

export default ErrorState;
