import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../constants/colors';

const QUICK_LOGINS = [
  { label: 'Parent Demo', email: 'rohit.sharma@gmail.com', password: 'password123', color: colors.parent },
  { label: 'Student Demo', email: 'arjun.sharma@vidyaschool.edu.in', password: 'password123', color: colors.student },
  { label: 'Teacher Demo', email: 'amit.patel@vidyaschool.edu.in', password: 'password123', color: colors.teacher },
];

export const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (overrideEmail?: string, overridePassword?: string) => {
    const loginEmail = overrideEmail ?? email;
    const loginPassword = overridePassword ?? password;

    if (!loginEmail || !loginPassword) {
      setError('Please fill in your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Title */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🏫</Text>
            </View>
            <Text style={styles.appTitle}>Vantage ERP</Text>
            <Text style={styles.appSubtitle}>School Management Portal</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>Access your school account</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

            <AppInput
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <AppButton
              title={loading ? 'Signing in…' : 'Sign In'}
              onPress={() => handleLogin()}
              loading={loading}
              style={styles.signInBtn}
            />
          </View>

          {/* Quick Access for Demo */}
          <View style={styles.quickSection}>
            <Text style={styles.quickTitle}>Quick Demo Access</Text>
            <View style={styles.quickRow}>
              {QUICK_LOGINS.map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={[styles.quickChip, { borderColor: q.color }]}
                  onPress={() => handleLogin(q.email, q.password)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickChipText, { color: q.color }]}>
                    {q.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.footerNote}>
            Secure access · Vantage ERP © 2026
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 48,
    paddingHorizontal: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
  },
  logoEmoji: { fontSize: 44 },
  appTitle: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 24,
  },
  formTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  signInBtn: { marginTop: 8 },
  quickSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  quickTitle: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  quickChipText: { fontSize: 13, fontWeight: '700' },
  footerNote: {
    color: colors.mutedText,
    fontSize: 11,
    textAlign: 'center',
  },
});

export default LoginScreen;
