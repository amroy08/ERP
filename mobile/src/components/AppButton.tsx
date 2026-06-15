import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../constants/colors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'parent' | 'student' | 'teacher' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceSoft;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.surface;
      case 'parent': return colors.parent;
      case 'student': return colors.student;
      case 'teacher': return colors.teacher;
      case 'danger': return colors.danger;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.mutedText;
    if (variant === 'secondary') return colors.text;
    return colors.white;
  };

  const getBorderStyle = () => {
    if (variant === 'secondary') {
      return {
        borderWidth: 1,
        borderColor: colors.border,
      };
    }
    return {};
  };

  const getShadowStyle = () => {
    if (disabled || variant === 'secondary') {
      return { elevation: 0, shadowOpacity: 0 };
    }
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    };
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorderStyle(),
        getShadowStyle(),
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
export default AppButton;
