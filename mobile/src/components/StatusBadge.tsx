import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

interface StatusBadgeProps {
  label: string;
  type?: 'success' | 'warning' | 'danger' | 'info' | 'parent' | 'student' | 'teacher';
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type = 'info', style }) => {
  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: colors.success };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: colors.warning };
      case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: colors.danger };
      case 'parent':
        return { bg: 'rgba(58, 134, 200, 0.15)', text: colors.parent };
      case 'student':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: colors.student };
      case 'teacher':
        return { bg: 'rgba(139, 92, 246, 0.15)', text: colors.teacher };
      case 'info':
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: colors.info };
    }
  };

  const badgeColors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: badgeColors.bg }, style]}>
      <Text style={[styles.text, { color: badgeColors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
export default StatusBadge;
