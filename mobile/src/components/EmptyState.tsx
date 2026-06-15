import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { AppCard } from './AppCard';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ emoji, title, subtitle, style }) => {
  return (
    <AppCard style={[styles.card, style]}>
      <View style={styles.container}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    paddingVertical: 32,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});

export default EmptyState;
