import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TextInputProps, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const AppInput: React.FC<AppInputProps> = ({ label, error, style, secureTextEntry, ...props }) => {
  const [isSecure, setIsSecure] = useState(!!secureTextEntry);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null, isPassword ? styles.inputWrapperPassword : null]}>
        <TextInput
          placeholderTextColor={colors.mutedText}
          style={[styles.input, style]}
          secureTextEntry={isPassword ? isSecure : false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSecure(!isSecure)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>{isSecure ? '👁️ Show' : '🙈 Hide'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  label: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    justifyContent: 'center',
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
    color: colors.text,
    fontSize: 16,
    height: '100%',
    flex: 1,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingLeft: 10,
  },
  toggleText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
export default AppInput;
