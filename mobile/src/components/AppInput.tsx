/**
 * Vantage ERP – AppInput (Premium Design System)
 * Clean, modern text input with label, error, and password toggle.
 * Uses AppIcon instead of emoji for the show/hide toggle.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TextInputProps, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, radii, sizing } from '../constants/layout';
import { typography } from '../constants/typography';
import { shadows } from '../constants/shadows';
import { AppIcon } from './AppIcon';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const AppInput: React.FC<AppInputProps> = ({ label, error, style, secureTextEntry, ...props }) => {
  const [isSecure, setIsSecure] = useState(!!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
          isPassword ? styles.inputWrapperPassword : null,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.mutedText}
          style={[styles.input, style]}
          secureTextEntry={isPassword ? isSecure : false}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSecure(!isSecure)}
            activeOpacity={0.7}
          >
            <AppIcon
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.mutedText}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    width: '100%',
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs + 2,
  },
  inputWrapper: {
    height: sizing.inputHeight,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    ...shadows.sm,
  },
  inputWrapperFocused: {
    borderColor: colors.borderFocus,
    ...shadows.colored(colors.primary, 0.08),
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  inputWrapperPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    ...typography.bodyLarge,
    color: colors.text,
    height: '100%',
    flex: 1,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingLeft: 10,
  },
  errorText: {
    ...typography.captionSmall,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});

export default AppInput;
